const assert = require("node:assert/strict");
const test = require("node:test");
const { AuthService } = require("./auth-service.cjs");

function user() {
  return { id: 1, login: "zenith-user", name: "Zenith User", avatarUrl: null, profileUrl: "https://github.com/zenith-user" };
}

test("auth service exposes safe metadata but never exposes the token", async () => {
  let saved = null;
  const tokenStore = { isAvailable: () => true, load: async () => null, save: async (value) => { saved = value; }, clear: async () => { saved = null; } };
  const githubAuth = { isConfigured: () => true, begin: async () => ({ challenge: { userCode: "ABCD-EFGH", verificationUri: "https://github.com/login/device", expiresAt: Date.now() + 1000 }, completion: Promise.resolve({ accessToken: "secret-token", scope: "repo", tokenType: "bearer" }) }), cancel: () => false };
  const service = new AuthService({ tokenStore, githubAuth, githubApi: { getCurrentUser: async () => user() } });
  await service.signInGitHub();
  await new Promise((resolve) => setImmediate(resolve));
  const state = service.getState();
  assert.equal(state.session.user.login, "zenith-user");
  assert.equal(service.getGitHubToken(), "secret-token");
  assert.equal(JSON.stringify(state).includes("secret-token"), false);
  assert.equal(saved.accessToken, "secret-token");
});

test("revoked saved credentials are cleared during restoration", async () => {
  let cleared = false;
  const service = new AuthService({
    tokenStore: { isAvailable: () => true, load: async () => ({ accessToken: "revoked" }), save: async () => {}, clear: async () => { cleared = true; } },
    githubAuth: { isConfigured: () => true, cancel: () => false },
    githubApi: { getCurrentUser: async () => { throw Object.assign(new Error("Bad credentials"), { code: "GITHUB_UNAUTHORIZED" }); } },
  });
  const state = await service.initialize();
  assert.equal(cleared, true);
  assert.equal(state.session, null);
  assert.equal(state.error.code, "GITHUB_UNAUTHORIZED");
});

test("offline restoration does not delete the encrypted credential", async () => {
  let cleared = false;
  const service = new AuthService({
    tokenStore: { isAvailable: () => true, load: async () => ({ accessToken: "saved" }), save: async () => {}, clear: async () => { cleared = true; } },
    githubAuth: { isConfigured: () => true, cancel: () => false },
    githubApi: { getCurrentUser: async () => { throw Object.assign(new Error("offline"), { code: "GITHUB_NETWORK_ERROR" }); } },
  });
  const state = await service.initialize();
  assert.equal(cleared, false);
  assert.equal(state.session, null);
  assert.match(state.error.message, /offline/i);
});
