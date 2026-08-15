const assert = require("node:assert/strict");
const test = require("node:test");
const { GitHubDeviceAuth, assertGitHubVerificationUrl } = require("./github-device-auth.cjs");

function response(body) {
  return { ok: true, status: 200, json: async () => body };
}

test("device auth opens only GitHub's verification page and supports cancellation", async () => {
  const opened = [];
  const requests = [];
  const provider = new GitHubDeviceAuth({
    clientId: "client-id",
    openExternal: async (url) => opened.push(url),
    fetch: async (url, options) => {
      requests.push({ url, body: String(options.body) });
      return response({ device_code: "backend-only-device-code", user_code: "ABCD-EFGH", verification_uri: "https://github.com/login/device", expires_in: 900, interval: 5 });
    },
  });
  const flow = await provider.begin();
  assert.deepEqual(flow.challenge.userCode, "ABCD-EFGH");
  assert.equal(opened[0], "https://github.com/login/device");
  assert.match(requests[0].body, /scope=repo/);
  provider.cancel();
  await assert.rejects(flow.completion, { code: "GITHUB_AUTH_CANCELLED" });
});

test("verification URL validation rejects non-GitHub redirects", () => {
  assert.throws(() => assertGitHubVerificationUrl("https://example.com/login/device"), { code: "GITHUB_AUTH_RESPONSE_INVALID" });
});
