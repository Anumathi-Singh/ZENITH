const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { runProcess } = require("./process-runner.cjs");
const { GitService } = require("./git-service.cjs");
const { WorkspaceService } = require("./workspace-service.cjs");

async function git(cwd, args) {
  const result = await runProcess("git", args, { cwd, timeoutMs: 20_000 });
  assert.equal(result.exitCode, 0, result.stderr);
  return result.stdout.trim();
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zenith git test "));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const workspace = new WorkspaceService();
  await workspace.open(root);
  return { root, service: new GitService(workspace) };
}

test("detects a non-repository and initializes it", async (t) => {
  const { root, service } = await fixture(t);
  assert.equal((await service.status()).isRepository, false);
  await service.init();
  const status = await service.status();
  assert.equal(status.isRepository, true);
  assert.equal(status.status.repositoryRoot, root);
});

test("stages, unstages, commits, and reports clean state", async (t) => {
  const { root, service } = await fixture(t);
  await git(root, ["init", "--initial-branch=main"]);
  await git(root, ["config", "user.name", "Zenith Test"]);
  await git(root, ["config", "user.email", "zenith@example.test"]);
  await fs.writeFile(path.join(root, "file with spaces.txt"), "first\n");
  let status = await service.status();
  assert.equal(status.status.untracked[0].path, "file with spaces.txt");
  await service.stage(["file with spaces.txt"]);
  status = await service.status();
  assert.equal(status.status.staged[0].path, "file with spaces.txt");
  await service.unstage(["file with spaces.txt"]);
  assert.equal((await service.status()).status.untracked.length, 1);
  await service.stageAll();
  await service.commit("Initial commit");
  assert.equal((await service.status()).status.clean, true);
  assert.equal((await service.history(1))[0].subject, "Initial commit");
});

test("fetches, pushes, and pulls through a disposable bare remote", async (t) => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "zenith remote test "));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const remote = path.join(base, "remote.git");
  const first = path.join(base, "first workspace");
  const second = path.join(base, "second workspace");
  await fs.mkdir(first);
  await git(base, ["init", "--bare", remote]);
  await git(first, ["init", "--initial-branch=main"]);
  await git(first, ["config", "user.name", "Zenith Test"]);
  await git(first, ["config", "user.email", "zenith@example.test"]);
  await fs.writeFile(path.join(first, "README.md"), "first\n");
  await git(first, ["add", "--all"]);
  await git(first, ["commit", "-m", "first"]);
  await git(first, ["remote", "add", "origin", remote]);
  await git(first, ["push", "-u", "origin", "main"]);
  await git(base, ["clone", "--branch", "main", remote, second]);
  await git(second, ["config", "user.name", "Zenith Test"]);
  await git(second, ["config", "user.email", "zenith@example.test"]);
  const workspace = new WorkspaceService();
  await workspace.open(second);
  const service = new GitService(workspace);
  await fs.writeFile(path.join(second, "second.txt"), "second\n");
  await service.stageAll();
  await service.commit("second");
  await service.push();
  await git(first, ["pull", "--ff-only"]);
  await fs.writeFile(path.join(first, "first.txt"), "first\n");
  await git(first, ["add", "--all"]);
  await git(first, ["commit", "-m", "third"]);
  await git(first, ["push"]);
  await service.fetch();
  assert.equal((await service.status()).status.branch.behind, 1);
  await service.pull();
  assert.equal((await fs.readFile(path.join(second, "first.txt"), "utf8")).replace(/\r\n/g, "\n"), "first\n");
});
