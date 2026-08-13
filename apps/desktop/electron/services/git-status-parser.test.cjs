const assert = require("node:assert/strict");
const test = require("node:test");
const { parseGitStatus } = require("./git-status-parser.cjs");

test("parses NUL-delimited branch headers and working changes", () => {
  const output = ["# branch.oid abc123", "# branch.head main", "# branch.upstream origin/main", "# branch.ab +2 -1", "1 .M N... 100644 100644 100644 aaaaaaa bbbbbbb src/app.ts", "? new file.txt", ""].join("\0");
  const status = parseGitStatus(output, "C:\\repo");
  assert.deepEqual(status.branch, { name: "main", detached: false, upstream: "origin/main", ahead: 2, behind: 1, oid: "abc123" });
  assert.equal(status.unstaged[0].path, "src/app.ts");
  assert.equal(status.untracked[0].path, "new file.txt");
  assert.equal(status.clean, false);
});

test("parses staged, renamed, and conflicted entries", () => {
  const output = ["# branch.oid abc123", "# branch.head main", "1 M. N... 100644 100644 100644 aaaaaaa bbbbbbb staged.txt", "2 R. N... 100644 100644 100644 aaaaaaa bbbbbbb R100 renamed.txt", "old.txt", "u UU N... 100644 100644 100644 100644 aaaaaaa bbbbbbb ccccccc conflict.txt", ""].join("\0");
  const status = parseGitStatus(output, "C:\\repo");
  assert.equal(status.staged.length, 2);
  assert.equal(status.staged[1].kind, "renamed");
  assert.equal(status.staged[1].oldPath, "old.txt");
  assert.equal(status.conflicts[0].path, "conflict.txt");
});
