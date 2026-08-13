const path = require("node:path");

const conflictCodes = new Set(["DD", "AU", "UD", "UA", "DU", "AA", "UU"]);

function kindFor(code) {
  if (code === "A") return "added";
  if (code === "D") return "deleted";
  if (code === "R") return "renamed";
  if (code === "C") return "copied";
  if (code === "U") return "conflicted";
  return "modified";
}

function splitFixed(record, fieldCount) {
  const fields = [];
  let start = 0;
  for (let index = 0; index < fieldCount; index += 1) {
    const separator = record.indexOf(" ", start);
    if (separator < 0) return [...fields, record.slice(start)];
    fields.push(record.slice(start, separator));
    start = separator + 1;
  }
  fields.push(record.slice(start));
  return fields;
}

function normalizedPath(value) {
  return value.split(path.sep).join("/");
}

function parseGitStatus(output, repositoryRoot) {
  const branch = { name: null, detached: false, upstream: null, ahead: 0, behind: 0, oid: null };
  const staged = [];
  const unstaged = [];
  const untracked = [];
  const conflicts = [];
  let cursor = 0;

  const addChange = (filePath, oldPath, indexCode, worktreeCode, forceConflict = false) => {
    const base = { path: normalizedPath(filePath), ...(oldPath ? { oldPath: normalizedPath(oldPath) } : {}), indexStatus: indexCode, workingTreeStatus: worktreeCode };
    if (forceConflict || conflictCodes.has(`${indexCode}${worktreeCode}`)) {
      conflicts.push({ ...base, kind: "conflicted", staged: false });
      return;
    }
    if (indexCode && indexCode !== ".") staged.push({ ...base, kind: kindFor(indexCode), staged: true });
    if (worktreeCode && worktreeCode !== ".") unstaged.push({ ...base, kind: kindFor(worktreeCode), staged: false });
  };

  while (cursor < output.length) {
    if (output[cursor] === "#") {
      const lineEnd = output.indexOf("\n", cursor);
      const nullEnd = output.indexOf("\0", cursor);
      const boundaries = [lineEnd, nullEnd].filter((value) => value >= 0);
      const end = boundaries.length ? Math.min(...boundaries) : output.length;
      const line = output.slice(cursor, end);
      if (line.startsWith("# branch.oid ")) branch.oid = line.slice(13) === "(initial)" ? null : line.slice(13);
      else if (line.startsWith("# branch.head ")) {
        const head = line.slice(14);
        branch.detached = head === "(detached)";
        branch.name = branch.detached ? null : head;
      } else if (line.startsWith("# branch.upstream ")) branch.upstream = line.slice(18);
      else if (line.startsWith("# branch.ab ")) {
        const match = /\+(\d+)\s+-(\d+)/.exec(line);
        if (match) { branch.ahead = Number(match[1]); branch.behind = Number(match[2]); }
      }
      cursor = end < output.length ? end + 1 : end;
      continue;
    }

    const recordEnd = output.indexOf("\0", cursor);
    const end = recordEnd < 0 ? output.length : recordEnd;
    const record = output.slice(cursor, end);
    cursor = end + (recordEnd < 0 ? 0 : 1);
    if (!record) continue;

    const type = record[0];
    if (type === "1") {
      const fields = splitFixed(record, 8);
      const [indexCode, worktreeCode] = fields[1] || "..";
      addChange(fields[8], null, indexCode, worktreeCode);
    } else if (type === "2") {
      const fields = splitFixed(record, 9);
      const originalEnd = output.indexOf("\0", cursor);
      const original = output.slice(cursor, originalEnd < 0 ? output.length : originalEnd);
      cursor = (originalEnd < 0 ? output.length : originalEnd + 1);
      const [indexCode, worktreeCode] = fields[1] || "..";
      addChange(fields[9], original, indexCode, worktreeCode);
    } else if (type === "u") {
      const fields = splitFixed(record, 10);
      const [indexCode, worktreeCode] = fields[1] || "UU";
      addChange(fields[10], null, indexCode, worktreeCode, true);
    } else if (type === "?") {
      const filePath = normalizedPath(record.slice(2));
      untracked.push({ path: filePath, kind: "untracked", staged: false, indexStatus: "?", workingTreeStatus: "?" });
    }
  }

  return { repositoryRoot, branch, staged, unstaged, untracked, conflicts, clean: staged.length + unstaged.length + untracked.length + conflicts.length === 0 };
}

module.exports = { parseGitStatus };
