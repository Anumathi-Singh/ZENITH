const assert = require("node:assert/strict");
const test = require("node:test");
const { GitHubApiClient } = require("./github-api-client.cjs");

const headers = (values = {}) => ({ get: (name) => values[name.toLowerCase()] ?? null });
const response = (status, body, headerValues) => ({ ok: status >= 200 && status < 300, status, headers: headers(headerValues), json: async () => body });

test("GitHub API client sends required headers and normalizes user data", async () => {
  let request;
  const client = new GitHubApiClient({ fetch: async (url, options) => { request = { url, options }; return response(200, { id: 7, login: "zenith-user", name: "Zenith User", avatar_url: "https://avatars.githubusercontent.com/u/7", html_url: "https://github.com/zenith-user" }); } });
  const user = await client.getCurrentUser("backend-token");
  assert.equal(user.login, "zenith-user");
  assert.equal(request.url, "https://api.github.com/user");
  assert.equal(request.options.headers.Authorization, "Bearer backend-token");
  assert.equal(request.options.headers["X-GitHub-Api-Version"], "2022-11-28");
});

test("GitHub API client reports rate limit reset without retrying", async () => {
  let calls = 0;
  const client = new GitHubApiClient({ fetch: async () => { calls += 1; return response(403, { message: "API rate limit exceeded" }, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "2000000000" }); } });
  await assert.rejects(() => client.getCurrentUser("token"), { code: "GITHUB_RATE_LIMITED" });
  assert.equal(calls, 1);
});

test("GitHub API client identifies revoked credentials", async () => {
  const client = new GitHubApiClient({ fetch: async () => response(401, { message: "Bad credentials" }) });
  await assert.rejects(() => client.getCurrentUser("revoked"), { code: "GITHUB_UNAUTHORIZED" });
});
