const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { WorkspaceIndex } = require("./workspace-index.cjs");

test("indexes metadata, excludes generated folders, ranks filenames, and rebuilds", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "Zenith project with spaces "));
  await fs.mkdir(path.join(root, "src", "theme"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules", "hidden"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "theme", "ThemeProvider.tsx"), "export const selectedThemeId = 'aurora';\n");
  await fs.writeFile(path.join(root, "src", "theme.ts"), "export {};\n");
  await fs.writeFile(path.join(root, "node_modules", "hidden", "ThemeProvider.tsx"), "hidden\n");
  const index = new WorkspaceIndex({ watchFactory: () => ({ close() {}, on() {} }) });
  await index.open(root);
  assert.equal(index.getState().status, "ready");
  assert.equal(index.getState().fileCount, 2);
  assert.equal(index.findFiles("ThemeProvider")[0].relativePath, "src/theme/ThemeProvider.tsx");
  await fs.writeFile(path.join(root, "src", "new-file.ts"), "new\n");
  await index.rebuild();
  assert.equal(index.findFiles("new-file")[0].relativePath, "src/new-file.ts");
  index.close();
  await fs.rm(root, { recursive: true, force: true });
});

test("the single debounced watcher refreshes external file changes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zenith-watch-"));
  await fs.writeFile(path.join(root, "initial.ts"), "initial\n");
  const index = new WorkspaceIndex({ watchDebounceMs: 40 });
  await index.open(root);
  await fs.writeFile(path.join(root, "external.ts"), "external\n");
  const deadline = Date.now() + 3000;
  while (!index.findFiles("external").length && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(index.findFiles("external")[0]?.relativePath, "external.ts");
  await fs.rename(path.join(root, "external.ts"), path.join(root, "renamed.ts"));
  const renameDeadline = Date.now() + 3000;
  while ((!index.findFiles("renamed").length || index.findFiles("external").length) && Date.now() < renameDeadline) await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(index.findFiles("renamed")[0]?.relativePath, "renamed.ts");
  assert.equal(index.findFiles("external").length, 0);
  await fs.rm(path.join(root, "renamed.ts"));
  const deleteDeadline = Date.now() + 3000;
  while (index.findFiles("renamed").length && Date.now() < deleteDeadline) await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(index.findFiles("renamed").length, 0);
  index.close();
  await fs.rm(root, { recursive: true, force: true });
});
