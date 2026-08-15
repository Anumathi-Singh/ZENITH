const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { SecureTokenStore } = require("./secure-token-store.cjs");

const encryption = {
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf8"),
  decryptString: (value) => value.toString("utf8").replace(/^encrypted:/, ""),
};

test("secure token store persists only the encrypted payload and clears it", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "zenith secure store "));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "github.bin");
  const store = new SecureTokenStore(filePath, encryption);
  const credentials = { accessToken: "secret-token-value", scope: "repo", tokenType: "bearer" };
  await store.save(credentials);
  const disk = await fs.readFile(filePath, "utf8");
  assert.match(disk, /^encrypted:/);
  assert.deepEqual(await store.load(), credentials);
  await store.clear();
  assert.equal(await store.load(), null);
});

test("secure token store refuses plaintext fallback", async () => {
  const store = new SecureTokenStore("unused", { isEncryptionAvailable: () => false });
  await assert.rejects(() => store.save({ accessToken: "token" }), { code: "SECURE_STORAGE_UNAVAILABLE" });
});
