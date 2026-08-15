const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { SearchService } = require("./search-service.cjs");
const { WorkspaceIndex } = require("./workspace-index.cjs");

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "Zenith search project "));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "ThemeProvider.tsx"), "const selectedThemeId = 'Aurora';\nconst selectedthemeid = 'lower';\n");
  await fs.writeFile(path.join(root, "src", "other.test.ts"), "selectedThemeId extra selectedThemeIdentifier\n");
  const index = new WorkspaceIndex({ watchFactory: () => ({ close() {}, on() {} }) });
  await index.open(root);
  return { root, index, search: new SearchService(index) };
}

test("content search supports case, whole word, regex, includes, and excludes", async () => {
  const { root, index, search } = await fixture();
  let results = await search.text({ searchId: "plain", query: "selectedThemeId" });
  assert.equal(results.length, 3);
  results = await search.text({ searchId: "case", query: "selectedThemeId", caseSensitive: true });
  assert.equal(results.length, 2);
  results = await search.text({ searchId: "word", query: "selectedThemeId", caseSensitive: true, wholeWord: true });
  assert.equal(results.length, 2);
  results = await search.text({ searchId: "exclude", query: "selectedThemeId", exclude: "*.test.ts" });
  assert.equal(results.length, 2);
  results = await search.text({ searchId: "regex", query: "selectedThemeI[dD]", regex: true, include: "src/**" });
  assert.ok(results.length >= 2);
  await assert.rejects(search.text({ searchId: "bad", query: "[", regex: true }), (error) => error.code === "INVALID_SEARCH_PATTERN");
  index.close(); await fs.rm(root, { recursive: true, force: true });
});

test("file and text searches have independent cancellable IDs", async () => {
  const { root, index, search } = await fixture();
  assert.equal((await search.files({ searchId: "files", query: "ThemeProvider" }))[0].name, "ThemeProvider.tsx");
  const pending = search.text({ searchId: "cancel-me", query: "selected" });
  search.cancel("cancel-me");
  await assert.rejects(pending, (error) => error.code === "SEARCH_CANCELLED");
  index.close(); await fs.rm(root, { recursive: true, force: true });
});
