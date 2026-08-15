const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { loadAppConfig, parseEnvironment } = require("./app-config.cjs");

test("parses quoted and unquoted environment values", () => {
  assert.deepEqual(parseEnvironment("# comment\nGITHUB_CLIENT_ID=from-file\nOTHER=\"hello world\"\n"), { GITHUB_CLIENT_ID: "from-file", OTHER: "hello world" });
});

test("loads the desktop .env only in development and lets the process environment win", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zenith config "));
  await fs.writeFile(path.join(root, ".env"), "GITHUB_CLIENT_ID=from-file\n", "utf8");
  assert.equal(loadAppConfig({ appRoot: root, development: true, environment: {} }).githubClientId, "from-file");
  assert.equal(loadAppConfig({ appRoot: root, development: true, environment: { GITHUB_CLIENT_ID: "from-process" } }).githubClientId, "from-process");
  assert.equal(loadAppConfig({ appRoot: root, development: false, environment: {} }).githubClientId, undefined);
  await fs.rm(root, { recursive: true, force: true });
});
