const path = require("node:path");
const { ProcessExecutionError, runProcess } = require("./process-runner.cjs");
const { parseGitStatus } = require("./git-status-parser.cjs");

function gitError(message, code = "GIT_OPERATION_FAILED") {
  return Object.assign(new Error(message), { code });
}

function cleanGitMessage(result, fallback) {
  return (result.stderr || result.stdout || fallback).trim().replace(/^error:\s*/i, "");
}

function sanitizeRemoteUrl(value) {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.username || parsed.password) {
      parsed.username = "";
      parsed.password = "";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/:\/\/[^/@\s]+@/, "://");
  }
}

class GitService {
  constructor(workspaceService, options = {}) {
    this.workspace = workspaceService;
    this.executable = options.executable || "git";
    this.runner = options.runner || runProcess;
  }

  async run(args, options = {}) {
    const cwd = options.cwd || this.workspace.requireRoot();
    try {
      const result = await this.runner(this.executable, args, {
        cwd,
        timeoutMs: options.timeoutMs ?? 30_000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", LC_ALL: "C", ...(options.env || {}) },
        signal: options.signal,
        onStdout: options.onStdout,
        onStderr: options.onStderr,
      });
      if (result.exitCode !== 0 && !options.allowFailure) throw gitError(cleanGitMessage(result, `Git exited with code ${result.exitCode}.`));
      return result;
    } catch (error) {
      if (error instanceof ProcessExecutionError && error.code === "EXECUTABLE_NOT_FOUND") throw gitError("Git is not installed or is not available on PATH.", "GIT_UNAVAILABLE");
      throw error;
    }
  }

  async getVersion() {
    try {
      const result = await this.runner(this.executable, ["--version"], { timeoutMs: 5_000, env: { ...process.env, LC_ALL: "C" } });
      if (result.exitCode !== 0) return { available: false, version: null };
      return { available: true, version: result.stdout.trim().replace(/^git version\s+/i, "") };
    } catch {
      return { available: false, version: null };
    }
  }

  async repositoryRoot() {
    const workspaceRoot = this.workspace.requireRoot();
    const result = await this.run(["rev-parse", "--show-toplevel"], { cwd: workspaceRoot, allowFailure: true });
    if (result.exitCode !== 0) return null;
    const repositoryRoot = path.resolve(result.stdout.trim());
    if (!this.workspace.contains(repositoryRoot)) throw gitError("The repository root is outside the selected workspace.", "REPOSITORY_OUTSIDE_WORKSPACE");
    return repositoryRoot;
  }

  async requireRepository() {
    const repositoryRoot = await this.repositoryRoot();
    if (!repositoryRoot) throw gitError("The open workspace is not a Git repository.", "NOT_GIT_REPOSITORY");
    return repositoryRoot;
  }

  async status() {
    const availability = await this.getVersion();
    if (!availability.available) return { ...availability, isRepository: false, status: null };
    const repositoryRoot = await this.repositoryRoot();
    if (!repositoryRoot) return { ...availability, isRepository: false, status: null };
    const result = await this.run(["status", "--porcelain=v2", "--branch", "-z"], { cwd: repositoryRoot });
    return { ...availability, isRepository: true, status: parseGitStatus(result.stdout, repositoryRoot) };
  }

  assertRelativePath(candidate, repositoryRoot) {
    if (typeof candidate !== "string" || !candidate || candidate.includes("\0")) throw gitError("A valid repository path is required.", "INVALID_GIT_PATH");
    const absolute = path.resolve(repositoryRoot, candidate);
    const relative = path.relative(repositoryRoot, absolute);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw gitError("The Git path is outside the repository.", "INVALID_GIT_PATH");
    this.workspace.assertPath(absolute);
    return relative;
  }

  async hasHead(repositoryRoot) {
    const result = await this.run(["rev-parse", "--verify", "HEAD"], { cwd: repositoryRoot, allowFailure: true });
    return result.exitCode === 0;
  }

  async stage(paths) {
    const repositoryRoot = await this.requireRepository();
    const safePaths = paths.map((candidate) => this.assertRelativePath(candidate, repositoryRoot));
    if (!safePaths.length) throw gitError("Choose at least one file to stage.", "INVALID_GIT_PATH");
    await this.run(["add", "--", ...safePaths], { cwd: repositoryRoot });
  }

  async unstage(paths) {
    const repositoryRoot = await this.requireRepository();
    const safePaths = paths.map((candidate) => this.assertRelativePath(candidate, repositoryRoot));
    if (!safePaths.length) throw gitError("Choose at least one file to unstage.", "INVALID_GIT_PATH");
    if (await this.hasHead(repositoryRoot)) await this.run(["restore", "--staged", "--", ...safePaths], { cwd: repositoryRoot });
    else await this.run(["rm", "--cached", "--", ...safePaths], { cwd: repositoryRoot });
  }

  async stageAll() {
    const repositoryRoot = await this.requireRepository();
    await this.run(["add", "--all"], { cwd: repositoryRoot });
  }

  async unstageAll() {
    const repositoryRoot = await this.requireRepository();
    if (await this.hasHead(repositoryRoot)) await this.run(["reset", "--quiet", "HEAD", "--"], { cwd: repositoryRoot });
    else await this.run(["rm", "-r", "--cached", "--ignore-unmatch", "."], { cwd: repositoryRoot });
  }

  async commit(message) {
    const normalized = typeof message === "string" ? message.trim() : "";
    if (!normalized) throw gitError("Enter a commit message.", "INVALID_COMMIT_MESSAGE");
    if (normalized.length > 4096) throw gitError("The commit message is too long.", "INVALID_COMMIT_MESSAGE");
    const repositoryRoot = await this.requireRepository();
    const result = await this.run(["commit", "-m", normalized], { cwd: repositoryRoot, timeoutMs: 60_000 });
    const match = /\[.+?\s+([0-9a-f]+)\]/i.exec(result.stdout);
    return { shortHash: match?.[1] || null, message: normalized };
  }

  async fetch() {
    const repositoryRoot = await this.requireRepository();
    await this.run(["fetch", "--prune"], { cwd: repositoryRoot, timeoutMs: 120_000 });
  }

  async pull() {
    const repositoryRoot = await this.requireRepository();
    await this.run(["pull", "--ff-only"], { cwd: repositoryRoot, timeoutMs: 120_000 });
  }

  async push() {
    const repositoryRoot = await this.requireRepository();
    await this.run(["push"], { cwd: repositoryRoot, timeoutMs: 120_000 });
  }

  async cloneRepository(repositoryUrl, destinationPath, options = {}) {
    const parent = path.dirname(destinationPath);
    const progress = (chunk) => {
      const message = String(chunk || "").trim().split(/\r?\n/).filter(Boolean).at(-1);
      if (message) options.onProgress?.(message.slice(0, 500));
    };
    await this.run(["clone", "--progress", "--", repositoryUrl, destinationPath], {
      cwd: parent,
      timeoutMs: 10 * 60_000,
      signal: options.signal,
      env: options.env,
      onStdout: progress,
      onStderr: progress,
    });
  }

  async addRemote(name, repositoryUrl) {
    if (typeof name !== "string" || !/^[A-Za-z0-9._-]+$/.test(name)) throw gitError("The remote name is not valid.", "INVALID_REMOTE_NAME");
    const repositoryRoot = await this.requireRepository();
    await this.run(["remote", "add", name, repositoryUrl], { cwd: repositoryRoot });
  }

  async pushUpstream(remote, branch, options = {}) {
    if (typeof remote !== "string" || !/^[A-Za-z0-9._-]+$/.test(remote)) throw gitError("The remote name is not valid.", "INVALID_REMOTE_NAME");
    const repositoryRoot = await this.requireRepository();
    const branchName = this.validateBranchName(branch);
    const check = await this.run(["check-ref-format", "--branch", branchName], { cwd: repositoryRoot, allowFailure: true });
    if (check.exitCode !== 0) throw gitError("The branch name is not valid.", "INVALID_BRANCH_NAME");
    await this.run(["push", "--set-upstream", remote, branchName], { cwd: repositoryRoot, timeoutMs: 5 * 60_000, env: options.env });
  }

  async branches() {
    const repositoryRoot = await this.requireRepository();
    const result = await this.run(["for-each-ref", "--format=%(refname:short)%00%(HEAD)", "refs/heads"], { cwd: repositoryRoot });
    return result.stdout.split("\n").filter(Boolean).map((line) => {
      const [name, marker] = line.split("\0");
      return { name, current: marker === "*" };
    });
  }

  validateBranchName(name) {
    const normalized = typeof name === "string" ? name.trim() : "";
    if (!normalized) throw gitError("Enter a branch name.", "INVALID_BRANCH_NAME");
    return normalized;
  }

  async checkoutBranch(name) {
    const repositoryRoot = await this.requireRepository();
    const branchName = this.validateBranchName(name);
    const check = await this.run(["check-ref-format", "--branch", branchName], { cwd: repositoryRoot, allowFailure: true });
    if (check.exitCode !== 0) throw gitError("The branch name is not valid.", "INVALID_BRANCH_NAME");
    await this.run(["switch", "--", branchName], { cwd: repositoryRoot });
  }

  async createBranch(name) {
    const repositoryRoot = await this.requireRepository();
    const branchName = this.validateBranchName(name);
    const check = await this.run(["check-ref-format", "--branch", branchName], { cwd: repositoryRoot, allowFailure: true });
    if (check.exitCode !== 0) throw gitError("The branch name is not valid.", "INVALID_BRANCH_NAME");
    await this.run(["switch", "-c", branchName], { cwd: repositoryRoot });
  }

  async remotes() {
    const repositoryRoot = await this.requireRepository();
    const result = await this.run(["remote"], { cwd: repositoryRoot });
    const names = result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    return Promise.all(names.map(async (name) => {
      const fetchResult = await this.run(["remote", "get-url", name], { cwd: repositoryRoot, allowFailure: true });
      const pushResult = await this.run(["remote", "get-url", "--push", name], { cwd: repositoryRoot, allowFailure: true });
      return { name, fetchUrl: sanitizeRemoteUrl(fetchResult.stdout), pushUrl: sanitizeRemoteUrl(pushResult.stdout) };
    }));
  }

  async history(limit = 20, skip = 0) {
    const repositoryRoot = await this.requireRepository();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const safeSkip = Math.max(Number(skip) || 0, 0);
    const format = "%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s%x1f%P%x1e";
    const result = await this.run(["log", `--max-count=${safeLimit}`, `--skip=${safeSkip}`, `--format=${format}`], { cwd: repositoryRoot, allowFailure: true });
    if (result.exitCode !== 0 && !(await this.hasHead(repositoryRoot))) return [];
    if (result.exitCode !== 0) throw gitError(cleanGitMessage(result, "Could not read Git history."));
    return result.stdout.split("\x1e").map((record) => record.trim()).filter(Boolean).map((record) => {
      const [hash, shortHash, author, email, date, subject, parents] = record.split("\x1f");
      return { hash, shortHash, author, email, date, subject, parents: parents ? parents.split(" ") : [] };
    });
  }

  async init() {
    const workspaceRoot = this.workspace.requireRoot();
    if (await this.repositoryRoot()) throw gitError("The workspace is already a Git repository.", "ALREADY_GIT_REPOSITORY");
    await this.run(["init"], { cwd: workspaceRoot });
    return { repositoryRoot: workspaceRoot };
  }
}

module.exports = { GitService, sanitizeRemoteUrl };
