const fs = require("node:fs/promises");
const path = require("node:path");

const MAX_FILE_CHARS = 32_000;
const MAX_CONTEXT_CHARS = 120_000;
const MAX_CONTEXT_FILES = 8;
const BINARY = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "pdf", "zip", "gz", "exe", "dll", "woff", "woff2", "ttf"]);

class AIWorkspaceTools {
  constructor(options) { this.workspace = options.workspace; this.index = options.index; this.search = options.search; this.git = options.git; }
  assertRelative(relativePath) {
    if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath)) throw Object.assign(new Error("AI workspace paths must be relative."), { code: "AI_INVALID_PATH" });
    const root = this.workspace.requireRoot();
    const absolute = path.resolve(root, relativePath);
    const relative = path.relative(root, absolute);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw Object.assign(new Error("AI workspace path is outside the open folder."), { code: "PATH_OUTSIDE_WORKSPACE" });
    return { absolute, relative: relative.split(path.sep).join("/") };
  }
  findWorkspaceFiles(query, limit = 12) { return this.index.findFiles(String(query || ""), { limit: Math.min(Math.max(limit, 1), 30) }).map(({ relativePath, name, extension }) => ({ relativePath, name, extension })); }
  async searchWorkspace(query, signal, limit = 24) {
    if (!String(query || "").trim()) return [];
    const searchId = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (signal?.aborted) throw Object.assign(new Error("AI context gathering was cancelled."), { code: "AI_CANCELLED" });
    const onAbort = () => this.search.cancel(searchId);
    signal?.addEventListener("abort", onAbort, { once: true });
    try { return (await this.search.text({ searchId, query: String(query), limit: Math.min(Math.max(limit, 1), 50) })).map(({ relativePath, line, preview }) => ({ relativePath, line, preview })); }
    finally { signal?.removeEventListener("abort", onAbort); }
  }
  async readWorkspaceFile(relativePath) {
    const candidate = this.assertRelative(relativePath);
    if (BINARY.has(path.extname(candidate.relative).slice(1).toLowerCase())) throw Object.assign(new Error("Binary files are not available to AI tools."), { code: "AI_BINARY_FILE" });
    const real = await this.workspace.assertExistingPath(candidate.absolute);
    const info = await fs.stat(real);
    if (!info.isFile() || info.size > 2 * 1024 * 1024) throw Object.assign(new Error("The requested AI context file is not a supported text file."), { code: "AI_FILE_LIMIT" });
    const buffer = await fs.readFile(real);
    if (buffer.subarray(0, 8192).includes(0)) throw Object.assign(new Error("Binary files are not available to AI tools."), { code: "AI_BINARY_FILE" });
    const full = buffer.toString("utf8");
    return { relativePath: candidate.relative, content: full.slice(0, MAX_FILE_CHARS), truncated: full.length > MAX_FILE_CHARS };
  }
  async gitContext() {
    try { return await this.git.aiContext(); }
    catch { return { available: false, summary: "Git context unavailable.", diff: "" }; }
  }
  async gatherInitial(input, signal) {
    const root = this.workspace.requireRoot();
    if (input.workspaceRoot && path.resolve(input.workspaceRoot) !== root) throw Object.assign(new Error("The AI request does not match the open workspace."), { code: "WORKSPACE_CHANGED" });
    const context = { request: String(input.message || "").slice(0, 12_000), selection: null, activeFile: null, openFiles: [], git: await this.gitContext(), files: [], searches: [] };
    if (input.selection?.text) context.selection = { text: String(input.selection.text).slice(0, 12_000), line: Number(input.selection.line) || 1, column: Number(input.selection.column) || 1 };
    if (input.activeFile?.path) {
      const relative = this.assertRelative(path.relative(root, input.activeFile.path)).relative;
      context.activeFile = { relativePath: relative, language: String(input.activeFile.language || "plaintext"), isDirty: Boolean(input.activeFile.isDirty), content: String(input.activeFile.content || "").slice(0, MAX_FILE_CHARS) };
    }
    context.openFiles = (Array.isArray(input.openFiles) ? input.openFiles : []).slice(0, 20).map((file) => ({ relativePath: this.assertRelative(path.relative(root, file.path)).relative, isDirty: Boolean(file.isDirty) }));
    return context;
  }
  async augment(context, plan, signal) {
    const seen = new Set(context.activeFile ? [context.activeFile.relativePath] : []);
    let total = context.activeFile?.content.length || 0;
    const candidates = [];
    for (const requested of plan.relevantFiles || []) {
      try {
        const exact = this.assertRelative(requested).relative;
        candidates.push(exact);
      } catch { /* model-proposed invalid paths are ignored */ }
      if (candidates.length < MAX_CONTEXT_FILES) for (const found of this.findWorkspaceFiles(requested, 3)) candidates.push(found.relativePath);
    }
    for (const term of (plan.searchTerms || []).slice(0, 4)) {
      if (signal.aborted) throw Object.assign(new Error("AI context gathering was cancelled."), { code: "AI_CANCELLED" });
      const results = await this.searchWorkspace(term, signal, 12);
      context.searches.push({ term, results });
      for (const result of results) candidates.push(result.relativePath);
    }
    for (const relativePath of candidates) {
      if (seen.has(relativePath) || context.files.length >= MAX_CONTEXT_FILES || total >= MAX_CONTEXT_CHARS) continue;
      try {
        const file = await this.readWorkspaceFile(relativePath);
        const remaining = MAX_CONTEXT_CHARS - total;
        file.content = file.content.slice(0, remaining);
        total += file.content.length; context.files.push(file); seen.add(relativePath);
      } catch { /* inaccessible or binary context is skipped */ }
    }
    return context;
  }
}

module.exports = { AIWorkspaceTools, MAX_CONTEXT_CHARS, MAX_CONTEXT_FILES, MAX_FILE_CHARS };
