const assert = require("node:assert/strict");
const test = require("node:test");
const { GitHubService, parseGitHubRemote, validateCloneUrl, validateGitHubWebUrl, validateRepositoryName } = require("./github-service.cjs");

test("parses common GitHub HTTPS and SSH remotes", () => {
  for (const remote of [
    "https://github.com/openai/codex.git",
    "https://github.com/openai/codex",
    "git@github.com:openai/codex.git",
    "ssh://git@github.com/openai/codex.git",
  ]) assert.deepEqual(parseGitHubRemote(remote), { owner: "openai", repo: "codex", fullName: "openai/codex", url: "https://github.com/openai/codex" });
});

test("does not treat non-GitHub or credential-bearing remotes as GitHub", () => {
  assert.equal(parseGitHubRemote("https://gitlab.com/openai/codex.git"), null);
  assert.equal(parseGitHubRemote("https://token@github.com/openai/codex.git"), null);
  assert.throws(() => validateCloneUrl("https://token@github.com/openai/codex.git"), { code: "INVALID_REPOSITORY_URL" });
});

test("validates publish names and external GitHub URLs", () => {
  assert.equal(validateRepositoryName("zenith_project-1"), "zenith_project-1");
  assert.throws(() => validateRepositoryName("bad/name"), { code: "INVALID_REPOSITORY_NAME" });
  assert.equal(validateGitHubWebUrl("https://github.com/openai/codex"), "https://github.com/openai/codex");
  assert.throws(() => validateGitHubWebUrl("https://example.com/openai/codex"), { code: "INVALID_GITHUB_URL" });
});

test("publish reports a real partial state when initial push fails", async () => {
  const calls = [];
  const service = new GitHubService({
    auth: { getGitHubToken: () => "backend-token" },
    api: { createRepository: async () => ({ id: 2, owner: "zenith-user", name: "project", fullName: "zenith-user/project", url: "https://github.com/zenith-user/project", cloneUrl: "https://github.com/zenith-user/project.git", sshUrl: "git@github.com:zenith-user/project.git", defaultBranch: null, private: true, fork: false, archived: false, description: null, visibility: "private" }) },
    git: {
      status: async () => ({ isRepository: true, status: { branch: { oid: "abc", name: "main", detached: false } } }),
      remotes: async () => [],
      addRemote: async (...args) => calls.push(["add", ...args]),
      pushUpstream: async (...args) => { calls.push(["push", ...args]); throw new Error("credential rejected"); },
    },
    workspace: {},
    credentialEnvironment: { forToken: async () => ({ GIT_ASKPASS: "helper" }) },
  });
  const result = await service.publishCurrentWorkspace({ name: "project", private: true, confirmed: true });
  assert.equal(result.stage, "remote-added");
  assert.equal(result.remoteAdded, true);
  assert.equal(result.pushed, false);
  assert.match(result.error.message, /Repository created and origin added/);
  assert.deepEqual(calls[0], ["add", "origin", "https://github.com/zenith-user/project.git"]);
  assert.equal(calls[1][0], "push");
});

test("publish refuses to overwrite an existing origin before creating anything", async () => {
  let created = false;
  const service = new GitHubService({
    auth: { getGitHubToken: () => "backend-token" },
    api: { createRepository: async () => { created = true; } },
    git: {
      status: async () => ({ isRepository: true, status: { branch: { oid: "abc", name: "main", detached: false } } }),
      remotes: async () => [{ name: "origin", fetchUrl: "https://example.com/repo.git", pushUrl: "https://example.com/repo.git" }],
    },
    workspace: {},
    credentialEnvironment: {},
  });
  await assert.rejects(() => service.publishCurrentWorkspace({ name: "project", confirmed: true }), { code: "ORIGIN_ALREADY_EXISTS" });
  assert.equal(created, false);
});
