// Production file:// smoke test; no provider credentials or user workspace are used.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  delete process.env.VITE_DEV_SERVER_URL;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'zenith-production-'));
  app.setPath('userData', path.join(root, 'profile'));
  const workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace);
  await fs.writeFile(path.join(workspace, 'hello.ts'), 'export const answer: number = 42;\n');
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [workspace] });
  require('../electron/main.cjs');
  await app.whenReady();
  while (!BrowserWindow.getAllWindows().length) await pause(50);
  const win = BrowserWindow.getAllWindows()[0];
  const evaluate = source => win.webContents.executeJavaScript(source, true);
  async function until(source) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) { if (await evaluate(source)) return; await pause(100); }
    throw new Error(`Timed out: ${source}`);
  }
  await until('Boolean(document.querySelector(".zenith-app"))');
  assert(win.webContents.getURL().startsWith('file:'));
  assert.equal(await evaluate('typeof require'), 'undefined');
  await evaluate('document.querySelector("[aria-label=\\"Open folder\\"]").click()');
  await until('Boolean(document.querySelector(".file-tree-file-row"))');
  await evaluate('document.querySelector(".file-tree-file-row").click()');
  await until('Boolean(document.querySelector(".monaco-editor textarea"))');
  await until('Boolean(document.querySelector(".xterm-screen"))');
  const previous = await evaluate('document.documentElement.dataset.theme');
  await evaluate('document.querySelector("[aria-label^=\\"Switch to\\"]").click()');
  await until(`document.documentElement.dataset.theme!==${JSON.stringify(previous)}`);
  const selected = await evaluate('document.documentElement.dataset.theme');
  await new Promise(resolve => { win.webContents.once('did-finish-load', resolve); win.reload(); });
  await until(`document.documentElement.dataset.theme===${JSON.stringify(selected)} && Boolean(document.querySelector('.zenith-app'))`);
  console.log('PASS production file:// startup, isolated renderer, real tree, local Monaco, xterm, theme reload persistence');
  console.log(`EVIDENCE ${root}`);
  win.destroy(); app.exit(0);
})().catch(error => { console.error(error); app.exit(1); });
