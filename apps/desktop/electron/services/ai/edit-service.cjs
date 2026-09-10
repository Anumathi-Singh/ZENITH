const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

function editError(message, code = "AI_EDIT_ERROR") { return Object.assign(new Error(message), { code }); }
function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function normalizeRelative(value) {
  if (typeof value !== "string" || !value.trim() || value.includes("\0") || path.isAbsolute(value)) throw editError("AI edit paths must be relative to the workspace.", "AI_INVALID_PATH");
  const normalized = path.normalize(value.trim());
  if (normalized === "." || normalized.startsWith(`..${path.sep}`) || normalized === "..") throw editError("AI edit path is outside the workspace.", "PATH_OUTSIDE_WORKSPACE");
  return normalized;
}
function unifiedDiff(relativePath, before, after) {
  const left = before.split("\n"); const right = after.split("\n"); let prefix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix += 1;
  const start = Math.max(0, prefix - 3); const leftEnd = Math.min(left.length, left.length - suffix + 3); const rightEnd = Math.min(right.length, right.length - suffix + 3);
  const body = [...left.slice(start, prefix).map((line) => ` ${line}`), ...left.slice(prefix, leftEnd - Math.min(3, suffix)).map((line) => `-${line}`), ...right.slice(prefix, rightEnd - Math.min(3, suffix)).map((line) => `+${line}`), ...right.slice(Math.max(prefix, right.length - suffix), rightEnd).map((line) => ` ${line}`)];
  return [`--- a/${relativePath}`, `+++ b/${relativePath}`, `@@ -${start + 1},${Math.max(leftEnd - start, 0)} +${start + 1},${Math.max(rightEnd - start, 0)} @@`, ...body].join("\n").slice(0, 120_000);
}

class AIEditService {
  constructor(workspace) { this.workspace = workspace; }
  resolve(relativePath) {
    const root = this.workspace.requireRoot(); const relative = normalizeRelative(relativePath); const absolute = path.resolve(root, relative);
    if (!this.workspace.contains(absolute)) throw editError("AI edit path is outside the workspace.", "PATH_OUTSIDE_WORKSPACE");
    return { root, relative: relative.split(path.sep).join("/"), absolute };
  }
  async validateTarget(edit) {
    const target = this.resolve(edit.path);
    if (!edit || !["modify", "create"].includes(edit.operation) || typeof edit.content !== "string" || edit.content.length > 500_000) throw editError("The AI returned an invalid edit proposal.", "AI_INVALID_EDIT");
    if (edit.operation === "modify") {
      const real = await this.workspace.assertExistingPath(target.absolute); const info = await fs.stat(real);
      if (!info.isFile()) throw editError("AI can only modify files.", "AI_INVALID_EDIT");
      target.absolute = real;
    } else {
      try { await fs.lstat(target.absolute); throw editError("AI cannot create a file that already exists.", "AI_EDIT_CONFLICT"); }
      catch (error) { if (error?.code !== "ENOENT") throw error; }
      const parent = await fs.realpath(path.dirname(target.absolute));
      if (!this.workspace.contains(parent)) throw editError("AI create target resolves outside the workspace.", "PATH_OUTSIDE_WORKSPACE");
    }
    return target;
  }
  async prepare(edits) {
    if (!Array.isArray(edits) || !edits.length || edits.length > 20) throw editError("The AI did not return a valid edit bundle.", "AI_INVALID_EDIT");
    const seen = new Set(); const proposals = [];
    for (const edit of edits) {
      const target = await this.validateTarget(edit);
      if (seen.has(target.relative)) throw editError("The AI proposed the same file more than once.", "AI_INVALID_EDIT");
      seen.add(target.relative);
      const before = edit.operation === "modify" ? await fs.readFile(target.absolute, "utf8") : "";
      proposals.push({ id: crypto.randomUUID(), operation: edit.operation, path: target.absolute, relativePath: target.relative, reason: String(edit.reason || ""), originalHash: digest(before), before, content: edit.content, diff: unifiedDiff(target.relative, before, edit.content) });
    }
    return proposals;
  }
  async apply(proposals, options = {}) {
    const dirty = new Set((options.dirtyPaths || []).map((value) => path.resolve(value).toLowerCase()));
    const verified = [];
    for (const proposal of proposals) {
      const target = this.resolve(proposal.relativePath);
      if (dirty.has(target.absolute.toLowerCase())) throw editError(`${proposal.relativePath} has unsaved editor changes. Save or close it before applying.`, "AI_DIRTY_FILE_CONFLICT");
      let current = "";
      if (proposal.operation === "modify") current = await fs.readFile(await this.workspace.assertExistingPath(target.absolute), "utf8");
      else { try { await fs.lstat(target.absolute); throw editError(`${proposal.relativePath} was created after this proposal was prepared.`, "AI_EDIT_CONFLICT"); } catch (error) { if (error?.code !== "ENOENT") throw error; } }
      if (digest(current) !== proposal.originalHash) throw editError(`${proposal.relativePath} changed after the proposal was prepared.`, "AI_EDIT_CONFLICT");
      verified.push({ ...proposal, absolute: target.absolute, current });
    }
    const completed = [];
    try {
      for (const edit of verified) {
        const temporary = `${edit.absolute}.zenith-${process.pid}-${crypto.randomUUID()}.tmp`;
        await fs.writeFile(temporary, edit.content, "utf8");
        if (edit.operation === "modify") {
          const backup = `${edit.absolute}.zenith-${process.pid}-${crypto.randomUUID()}.bak`;
          await fs.rename(edit.absolute, backup); completed.push({ ...edit, temporary, backup });
          await fs.rename(temporary, edit.absolute);
        } else { completed.push({ ...edit, temporary, backup: null }); await fs.rename(temporary, edit.absolute); }
      }
      for (const edit of completed) if (edit.backup) await fs.rm(edit.backup, { force: true });
      return { appliedPaths: verified.map((item) => item.absolute) };
    } catch (error) {
      for (const edit of completed.reverse()) {
        try { await fs.rm(edit.absolute, { force: true }); if (edit.backup) await fs.rename(edit.backup, edit.absolute); } catch { /* best-effort rollback */ }
        try { await fs.rm(edit.temporary, { force: true }); } catch { /* best-effort cleanup */ }
      }
      throw editError(`Zenith could not apply the approved edit bundle: ${error instanceof Error ? error.message : String(error)}`, "AI_APPLY_FAILED");
    }
  }
}
module.exports = { AIEditService, digest, editError, normalizeRelative, unifiedDiff };
