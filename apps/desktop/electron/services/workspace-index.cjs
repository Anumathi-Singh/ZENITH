const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_EXCLUSIONS = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache", "out", "vendor", ".next"]);

function indexError(message, code = "INDEX_ERROR") { return Object.assign(new Error(message), { code }); }
function normalizedRelative(value) { return value.split(path.sep).join("/"); }
function fuzzyScore(candidate, query) {
  let cursor = 0; let gap = 0;
  for (const character of query) {
    const found = candidate.indexOf(character, cursor);
    if (found < 0) return null;
    gap += found - cursor; cursor = found + 1;
  }
  return gap;
}

class WorkspaceIndex extends EventEmitter {
  constructor(options = {}) {
    super();
    this.root = null;
    this.entries = [];
    this.state = { status: "idle", rootPath: null, fileCount: 0, version: 0, error: null, watching: false };
    this.exclusions = new Set(options.exclusions || DEFAULT_EXCLUSIONS);
    this.watchFactory = options.watchFactory || fs.watch;
    this.watcher = null;
    this.watchTimer = null;
    this.controller = null;
    this.generation = 0;
    this.watchDebounceMs = options.watchDebounceMs || 220;
  }

  getState() { return { ...this.state }; }
  listFiles() { return this.entries.slice(); }
  publish(patch) { this.state = { ...this.state, ...patch }; this.emit("changed", this.getState()); }
  excluded(relativePath) { return normalizedRelative(relativePath).split("/").some((part) => this.exclusions.has(part)); }

  async open(rootPath) {
    const root = await fsp.realpath(path.resolve(rootPath));
    const info = await fsp.stat(root);
    if (!info.isDirectory()) throw indexError("The workspace index requires a folder.", "INVALID_WORKSPACE");
    if (this.root !== root) this.entries = [];
    this.root = root;
    return this.rebuild();
  }

  async rebuild() {
    if (!this.root) { this.close(); return this.getState(); }
    this.stopWatcher();
    this.controller?.abort();
    const controller = new AbortController();
    const generation = ++this.generation;
    this.controller = controller;
    this.publish({ status: "indexing", rootPath: this.root, fileCount: this.entries.length, error: null, watching: false });
    try {
      const entries = await this.scan(this.root, controller.signal);
      if (controller.signal.aborted || generation !== this.generation) return this.getState();
      entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
      this.entries = entries;
      this.publish({ status: "ready", fileCount: entries.length, version: this.state.version + 1, error: null });
      this.startWatcher();
    } catch (error) {
      if (controller.signal.aborted || generation !== this.generation) return this.getState();
      this.entries = [];
      this.publish({ status: "error", fileCount: 0, error: error instanceof Error ? error.message : "Could not index this workspace." });
    }
    return this.getState();
  }

  async scan(root, signal) {
    const files = []; const directories = [root]; let visited = 0;
    while (directories.length) {
      if (signal.aborted) throw indexError("Workspace indexing was cancelled.", "INDEX_CANCELLED");
      const directory = directories.pop();
      let children;
      try { children = await fsp.readdir(directory, { withFileTypes: true }); }
      catch (error) {
        if (directory === root) throw indexError("Zenith cannot read the selected workspace.", "WORKSPACE_INACCESSIBLE");
        if (["EACCES", "EPERM", "ENOENT"].includes(error?.code)) continue;
        throw error;
      }
      for (const child of children) {
        const absolutePath = path.join(directory, child.name);
        const relativePath = normalizedRelative(path.relative(root, absolutePath));
        if (this.excluded(relativePath) || child.isSymbolicLink()) continue;
        if (child.isDirectory()) directories.push(absolutePath);
        else if (child.isFile()) files.push({ path: absolutePath, relativePath, name: child.name, extension: path.extname(child.name).slice(1).toLowerCase(), directory: normalizedRelative(path.dirname(relativePath)) === "." ? "" : normalizedRelative(path.dirname(relativePath)) });
        if (++visited % 250 === 0) await new Promise((resolve) => setImmediate(resolve));
      }
    }
    return files;
  }

  startWatcher() {
    if (!this.root) return;
    try {
      this.watcher = this.watchFactory(this.root, { recursive: true }, (_event, filename) => {
        if (filename && this.excluded(String(filename))) return;
        clearTimeout(this.watchTimer);
        this.watchTimer = setTimeout(() => { if (this.root) void this.rebuild(); }, this.watchDebounceMs);
      });
      this.watcher.on?.("error", () => { this.stopWatcher(); this.publish({ watching: false }); });
      this.publish({ watching: true });
    } catch { this.publish({ watching: false }); }
  }

  stopWatcher() { clearTimeout(this.watchTimer); this.watchTimer = null; this.watcher?.close(); this.watcher = null; }
  close() {
    this.generation += 1; this.controller?.abort(); this.controller = null; this.stopWatcher();
    this.root = null; this.entries = [];
    this.publish({ status: "idle", rootPath: null, fileCount: 0, version: this.state.version + 1, error: null, watching: false });
  }

  findFiles(query, options = {}) {
    if (!this.root) throw indexError("Open a folder to search files.", "NO_WORKSPACE");
    const needle = String(query || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
    if (!needle) return [];
    return this.entries.map((entry) => {
      const name = entry.name.toLowerCase(); const relative = entry.relativePath.toLowerCase(); let score;
      if (name === needle) score = 0;
      else if (name.startsWith(needle)) score = 10 + name.length - needle.length;
      else if (name.includes(needle)) score = 30 + name.indexOf(needle);
      else if (relative.includes(needle)) score = 60 + relative.indexOf(needle);
      else { const fuzzy = fuzzyScore(relative, needle); if (fuzzy === null) return null; score = 100 + fuzzy; }
      return { entry, score };
    }).filter(Boolean).sort((left, right) => left.score - right.score || left.entry.relativePath.length - right.entry.relativePath.length || left.entry.relativePath.localeCompare(right.entry.relativePath)).slice(0, limit).map(({ entry }) => ({ ...entry }));
  }
}

module.exports = { DEFAULT_EXCLUSIONS, WorkspaceIndex, indexError, normalizedRelative };
