const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const MAX_FILE_BYTES = 2 * 1024 * 1024;

class WorkspaceService {
  constructor() {
    this.root = null;
    this.snapshots = new Map();
    this.writes = new Map();
    this.openGeneration = 0;
  }

  async open(candidate) {
    const generation = ++this.openGeneration;
    if (typeof candidate !== "string" || !candidate.trim()) throw Object.assign(new Error("A workspace folder is required."), { code: "INVALID_WORKSPACE" });
    const realPath = await fs.realpath(path.resolve(candidate));
    const info = await fs.stat(realPath);
    if (!info.isDirectory()) throw Object.assign(new Error("The selected workspace is not a folder."), { code: "INVALID_WORKSPACE" });
    if (generation !== this.openGeneration) throw new Error("Workspace selection was superseded.");
    this.root = realPath;
    this.snapshots.clear();
    return { path: realPath, name: path.basename(realPath) };
  }

  close() {
    this.openGeneration += 1;
    this.root = null;
    this.snapshots.clear();
  }

  getRoot() {
    return this.root;
  }

  requireRoot() {
    if (!this.root) throw Object.assign(new Error("No workspace is open."), { code: "NO_WORKSPACE" });
    return this.root;
  }

  contains(candidate) {
    const root = this.requireRoot();
    const relative = path.relative(root, path.resolve(candidate));
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  }

  assertPath(candidate) {
    if (typeof candidate !== "string" || !candidate) throw Object.assign(new Error("A workspace path is required."), { code: "INVALID_PATH" });
    const resolved = path.resolve(candidate);
    if (candidate.includes("\0") || (process.platform === "win32" && /:/.test(candidate.replace(/^[a-z]:/i, "")))) throw new Error("Invalid workspace path.");
    if (!this.contains(resolved)) throw Object.assign(new Error("Path is outside the selected workspace."), { code: "PATH_OUTSIDE_WORKSPACE" });
    return resolved;
  }

  async assertExistingPath(candidate) {
    const root = this.requireRoot();
    const resolved = this.assertPath(candidate);
    const realPath = await fs.realpath(resolved);
    if (this.root !== root) throw new Error("The workspace changed during the operation.");
    if (!this.contains(realPath)) throw Object.assign(new Error("Path resolves outside the selected workspace."), { code: "PATH_OUTSIDE_WORKSPACE" });
    return realPath;
  }

  async readFile(candidate) {
    const root = this.requireRoot();
    const resolved = await this.assertExistingPath(candidate);
    const info = await fs.stat(resolved);
    if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error("Only text files up to 2 MiB can be opened.");
    const bytes = await fs.readFile(resolved);
    if (this.root !== root || bytes.length > MAX_FILE_BYTES) throw new Error("The workspace or file changed while reading.");
    if (bytes.includes(0)) throw new Error("Binary and UTF-16 files are not supported. The file was not opened.");
    let content;
    try { content = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
    catch { throw new Error("This file is not valid UTF-8. Opening it as text could corrupt it."); }
    this.snapshots.set(resolved, { bytes, bom: bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) });
    return content;
  }

  async writeFile(candidate, content) {
    if (typeof content !== "string" || Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) throw new Error("Save requires UTF-8 text up to 2 MiB.");
    const root = this.requireRoot();
    // Reserve the queue before the first await so invocation order is preserved.
    const queuePath = this.assertPath(candidate);
    const previous = this.writes.get(queuePath) || Promise.resolve();
    const write = previous.catch(() => {}).then(async () => {
      const resolved = await this.assertExistingPath(candidate);
      const snapshot = this.snapshots.get(resolved);
      if (!snapshot || this.root !== root) throw new Error("Reopen this file in the current workspace before saving.");
      const info = await fs.stat(resolved);
      if (!info.isFile()) throw new Error("Save target is not a file.");
      const checkUnchanged = async () => {
        if (this.root !== root || await this.assertExistingPath(candidate) !== resolved) throw new Error("The save target changed.");
        if (!(await fs.readFile(resolved)).equals(snapshot.bytes)) throw new Error("File changed on disk. Your edits are kept; review the disk version before saving.");
      };
      await checkUnchanged();
      const bytes = Buffer.from((snapshot.bom ? "\uFEFF" : "") + content, "utf8");
      const temporary = path.join(path.dirname(resolved), `.${path.basename(resolved)}.zenith-${randomUUID()}.tmp`);
      let handle;
      try {
        handle = await fs.open(temporary, "wx", info.mode);
        await handle.writeFile(bytes);
        await handle.sync();
        await handle.close(); handle = null;
        await checkUnchanged();
        await fs.rename(temporary, resolved);
        this.snapshots.set(resolved, { bytes, bom: snapshot.bom });
      } finally {
        await handle?.close();
        await fs.rm(temporary, { force: true });
      }
    });
    this.writes.set(queuePath, write);
    try { await write; } finally { if (this.writes.get(queuePath) === write) this.writes.delete(queuePath); }
  }
}

module.exports = { WorkspaceService };
