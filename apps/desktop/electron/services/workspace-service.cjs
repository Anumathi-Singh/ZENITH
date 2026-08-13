const fs = require("node:fs/promises");
const path = require("node:path");

class WorkspaceService {
  constructor() {
    this.root = null;
  }

  async open(candidate) {
    if (typeof candidate !== "string" || !candidate.trim()) throw Object.assign(new Error("A workspace folder is required."), { code: "INVALID_WORKSPACE" });
    const realPath = await fs.realpath(path.resolve(candidate));
    const info = await fs.stat(realPath);
    if (!info.isDirectory()) throw Object.assign(new Error("The selected workspace is not a folder."), { code: "INVALID_WORKSPACE" });
    this.root = realPath;
    return { path: realPath, name: path.basename(realPath) };
  }

  close() {
    this.root = null;
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
    if (!this.contains(resolved)) throw Object.assign(new Error("Path is outside the selected workspace."), { code: "PATH_OUTSIDE_WORKSPACE" });
    return resolved;
  }

  async assertExistingPath(candidate) {
    const resolved = this.assertPath(candidate);
    const realPath = await fs.realpath(resolved);
    if (!this.contains(realPath)) throw Object.assign(new Error("Path resolves outside the selected workspace."), { code: "PATH_OUTSIDE_WORKSPACE" });
    return realPath;
  }
}

module.exports = { WorkspaceService };
