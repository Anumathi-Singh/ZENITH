// Runs the actual Electron main/preload/renderer against an isolated disposable workspace.
// Only the native folder chooser is substituted; filesystem, Monaco and PTYs are real.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

let fixture, window;
const failures = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = (source) => window.webContents.executeJavaScript(source, true);
async function until(source, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(source)) return; await pause(100); }
  throw new Error(`Timed out: ${source.slice(0, 140)}`);
}
async function check(name, operation) {
  try { await operation(); console.log(`PASS ${name}`); }
  catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
}

(async () => {
  fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'zenith-audit-'));
  app.setPath('userData', path.join(fixture, 'profile'));
  const project = path.join(fixture, 'Test project');
  await fs.mkdir(path.join(project, 'src'), { recursive: true });
  await fs.writeFile(path.join(project, 'src', 'hello.ts'), 'export const greeting = "original";\r\n');
  await fs.writeFile(path.join(project, 'settings.json'), '{"audit": true}\n');
  await fs.writeFile(path.join(project, 'space name.js'), 'console.log("safe fixture");\n');
  await fs.writeFile(path.join(project, 'large.txt'), 'large\n'.repeat(400000));
  execFileSync('git', ['init', project], { windowsHide: true, stdio: 'ignore' });
  let pickerCalls = 0;
  dialog.showOpenDialog = async (_window, options) => {
    assert(options.properties.includes('openDirectory'));
    pickerCalls += 1;
    return { canceled: false, filePaths: [project] };
  };
  require('../electron/main.cjs');
  await app.whenReady();
  while (!BrowserWindow.getAllWindows().length) await pause(100);
  window = BrowserWindow.getAllWindows()[0];
  // The automation desktop can be occluded; keep its rendering/resize callbacks active.
  window.webContents.setBackgroundThrottling(false);
  await until('Boolean(document.querySelector(".zenith-app"))');
  await evaluate(`window.audit = {}; Promise.all([
    import('/src/components/editor/editorStore.ts'),
    import('/src/components/explorer/workspaceStore.ts'),
    import('/src/components/layout/layoutStore.ts'),
    import('/src/components/ui/uiStore.ts'),
    import('/node_modules/.vite/deps/monaco-editor.js'),
    import('/src/components/theme/themes.ts')
  ]).then(([e,w,l,u,m,t]) => { audit.editor=e.useEditorStore; audit.workspace=w.useWorkspaceStore; audit.layout=l.useLayoutStore; audit.ui=u.useUiStore; audit.monaco=m; audit.themes=t.themes; })`);
  await until('Boolean(audit.themes)');
  await check('Open Folder control → desktop bridge → real tree', async () => {
    await evaluate('document.querySelector("[aria-label=\\"Open folder\\"]").click()');
    await until('audit.workspace.getState().tree.length >= 4');
    assert.equal(pickerCalls, 1);
  });
  await check('Folder first click expands and loads children', async () => {
    await evaluate('document.querySelector(".file-tree-folder-row").click()');
    await until('Boolean(document.querySelector(".file-tree-file-row[title$=\\"hello.ts\\"]"))', 2500);
  });
  // Continue testing file/editor even when the expansion regression prevented the first click.
  await evaluate(`audit.workspace.getState().openFilePath(${JSON.stringify(path.join(project, 'src', 'hello.ts'))}).then(f=>audit.editor.getState().openTab(f))`);
  await check('Monaco actually loads', () => until('Boolean(document.querySelector(".monaco-editor textarea"))', 25000));
  await check('Real file disk content', async () => assert.equal(await evaluate('audit.editor.getState().tabs[0].content'), 'export const greeting = "original";\r\n'));
  await check('Save while typing keeps later changes dirty', async () => {
    // Use a large write and immediately edit the buffer after starting the real save.
    await evaluate(`(async()=>{const e=audit.editor.getState(), id=e.activeTab; e.updateContent(id,${JSON.stringify('export const greeting = "saved";\r\n')}); const saving=e.saveTab(id); e.updateContent(id,${JSON.stringify('export const greeting = "later";\r\n')}); await saving;})()`);
    assert.equal(await evaluate('audit.editor.getState().tabs[0].isDirty'), true);
    assert.equal(await fs.readFile(path.join(project, 'src', 'hello.ts'), 'utf8'), 'export const greeting = "saved";\r\n');
  });
  await check('Terminal collapse restores connected xterm host', async () => {
    await until('Boolean(document.querySelector(".xterm-screen"))');
    await evaluate('document.querySelector(".terminal-title").click()');
    await pause(200);
    await evaluate('document.querySelector(".terminal-title").click()');
    await until('Boolean(document.querySelector(".zenith-terminal-host .xterm-screen"))', 2500);
  });
  await check('Monaco typing and Ctrl+S write exact disk bytes', async () => {
    await evaluate(`audit.codeEditor=audit.monaco.editor.getEditors()[0]; audit.model=audit.codeEditor.getModel(); audit.codeEditor.executeEdits('audit',[{range:audit.model.getFullModelRange(),text:'export const verified = 42;\\r\\n'}]); audit.codeEditor.focus()`);
    await until('audit.editor.getState().tabs[0].content.includes("verified")');
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'s',ctrlKey:true,bubbles:true,cancelable:true})); void 0`);
    await until('!audit.editor.getState().tabs[0].isDirty && !audit.editor.getState().tabs[0].isSaving');
    assert.equal(await fs.readFile(path.join(project, 'src', 'hello.ts'), 'utf8'), 'export const verified = 42;\r\n');
  });
  await check('Dirty tab refuses close when discard is declined', async () => {
    assert.equal(await evaluate(`(()=>{const e=audit.editor.getState(); e.updateContent(e.activeTab,e.tabs[0].content+'// dirty'); const original=window.confirm; let asked=false; window.confirm=()=>{asked=true;return false}; try { e.closeTab(e.activeTab); return asked && audit.editor.getState().tabs.length===1; } finally {window.confirm=original}})()`), true);
  });
  await check('Tab switching preserves Monaco model, selection and undo', async () => {
    await evaluate(`audit.first=audit.editor.getState().activeTab; audit.codeEditor.setSelection({startLineNumber:1,startColumn:2,endLineNumber:1,endColumn:8}); audit.selection=audit.codeEditor.getSelection();`);
    await evaluate(`audit.workspace.getState().openFilePath(${JSON.stringify(path.join(project, 'settings.json'))}).then(f=>audit.editor.getState().openTab(f))`);
    await until('audit.codeEditor.getModel() !== audit.model');
    await evaluate('audit.editor.getState().setActiveTab(audit.first)');
    await until('audit.codeEditor.getModel() === audit.model');
    assert.equal(await evaluate('JSON.stringify(audit.codeEditor.getSelection())===JSON.stringify(audit.selection) && audit.model.canUndo()'), true);
  });
  await check('Every theme applies without replacing Monaco or terminal DOM', async () => {
    await evaluate(`audit.xterm=document.querySelector('.xterm-screen'); audit.ui.getState().openSettings('Appearance')`);
    await until('document.querySelectorAll(".theme-preview-card").length > 0');
    const count = await evaluate('document.querySelectorAll(".theme-preview-card").length');
    for (let i=0; i<count; i++) {
      await evaluate(`document.querySelectorAll('.theme-preview-card')[${i}].click()`);
      await pause(50);
      assert.equal(await evaluate(`document.querySelectorAll('.theme-preview-card')[${i}].classList.contains('applied') && audit.monaco.editor.getEditors()[0]===audit.codeEditor && audit.codeEditor.getModel()===audit.model && document.querySelector('.xterm-screen')===audit.xterm && audit.model.canUndo()`), true);
    }
    await evaluate('audit.ui.getState().closeSettings()');
    await pause(100);
    const target = await evaluate(`document.querySelector('[aria-label^="Switch to"]').getAttribute('aria-label').includes('light') ? 'light':'dark'`);
    await evaluate(`document.querySelector('[aria-label^="Switch to"]').click()`);
    await until(`document.documentElement.dataset.appearance===${JSON.stringify(target)}`);
  });
  await check('Real PTY runs in workspace and survives theme/collapse changes', async () => {
    await evaluate(`audit.output=''; audit.removeOutput=zenithDesktop.onTerminalData(e=>{if(e.id===audit.pty?.id)audit.output+=e.data}); zenithDesktop.createTerminal('command-prompt').then(p=>{audit.pty=p; return null})`);
    await until('Boolean(audit.pty)');
    assert.equal(await evaluate('audit.pty.cwd'), project);
    await evaluate(`zenithDesktop.terminalInput(audit.pty.id,'set ZENITH_AUDIT=retained\\r')`);
    await evaluate(`document.querySelector('[aria-label^="Switch to"]').click(); document.querySelector('.terminal-title').click()`);
    await pause(100);
    await evaluate(`document.querySelector('.terminal-title').click(); audit.output=''; zenithDesktop.terminalInput(audit.pty.id,'echo %ZENITH_AUDIT%\\r')`);
    await until('audit.output.includes("retained")');
    await evaluate('zenithDesktop.killTerminal(audit.pty.id).then(()=>{audit.removeOutput(); return null})');
  });
  await check('SidePanel and terminal drag bounds and pointer cancellation', async () => {
    await evaluate(`audit.layout.getState().setAIPanelOpen(false)`);
    await pause(100);
    for (const selector of ['.panel-resize-handle-right', '.terminal-resize-handle']) {
      await evaluate(`(()=>{const h=document.querySelector(${JSON.stringify(selector)}); h.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:280,clientY:600,pointerId:1})); window.dispatchEvent(new PointerEvent('pointermove',{clientX:5000,clientY:-1000})); window.dispatchEvent(new PointerEvent('pointercancel'));})()`);
    }
    await pause(100);
    const dimensions = await evaluate('({side:audit.layout.getState().sidePanelWidth,workspace:document.querySelector(".workspace-wrap").getBoundingClientRect().height,terminal:document.querySelector(".terminal-panel").getBoundingClientRect().height})');
    assert(dimensions.side<=520 && dimensions.workspace>=239, JSON.stringify(dimensions));
    window.setSize(960,680);
    await until('document.querySelector(".monaco-editor").getBoundingClientRect().width>100 && document.querySelector(".workspace-wrap").getBoundingClientRect().height>=239');
    const small = await evaluate('({editor:document.querySelector(".monaco-editor").getBoundingClientRect().width,workspace:document.querySelector(".workspace-wrap").getBoundingClientRect().height,terminal:document.querySelector(".terminal-panel").getBoundingClientRect().height,viewport:innerHeight})');
    assert(small.editor>100 && small.workspace>=239, JSON.stringify(small));
    window.setSize(1440,920);
  });
  await check('Search and local Git cross the real preload boundary', async () => {
    await until(`zenithDesktop.workspaceIndex.getState().then(r=>r.ok && r.data.status==='ready')`);
    const result = await evaluate(`zenithDesktop.search.text({searchId:'audit',query:'verified'})`);
    assert.equal(result.ok, true); assert.equal(result.data[0].line, 1); assert.equal(result.data[0].column, 14);
    const git = await evaluate('zenithDesktop.git.getStatus()');
    assert.equal(git.ok, true); assert.equal(git.data.isRepository, true);
  });
  await check('Invalid stored theme IDs fall back after renderer reload', async () => {
    await evaluate(`audit.editor.getState().clearTabs(); localStorage.setItem('zenith-preferences',JSON.stringify({confirmBeforeClosingDirtyFiles:0,density:{bad:true},defaultTerminalProfile:42})); localStorage.setItem('zenith-theme-preferences-v1',JSON.stringify({selectedThemeId:'__proto__',preferredLightThemeId:'missing',preferredDarkThemeId:'constructor'}))`);
    await new Promise(resolve=>{window.webContents.once('did-finish-load',resolve);window.reload()});
    await until(`Boolean(document.querySelector('.zenith-app')) && document.documentElement.dataset.theme==='light'`);
    const prefs=await evaluate(`JSON.parse(localStorage.getItem('zenith-theme-preferences-v1'))`);
    assert.equal(prefs.preferredLightThemeId,'light'); assert.equal(prefs.preferredDarkThemeId,'dark');
    assert.equal(await evaluate(`import('/src/components/settings/appPreferences.ts').then(m=>m.useAppPreferences.getState().confirmBeforeClosingDirtyFiles===true && m.useAppPreferences.getState().density==='comfortable' && m.useAppPreferences.getState().defaultTerminalProfile==='')`),true);
  });
  try { await fs.writeFile(path.join(fixture, 'desktop.png'), (await window.webContents.capturePage()).toPNG()); }
  catch (error) { console.log(`SCREENSHOT UNAVAILABLE ${error.message}`); }
  console.log(`EVIDENCE ${fixture}`);
  console.log(`RESULT ${failures.length} failure(s): ${failures.join(', ')}`);
  // Fixture is deliberately retained for independent inspection; no user project files are used.
  window.webContents.removeAllListeners('will-prevent-unload');
  window.destroy();
  app.exit(failures.length ? 1 : 0);
})().catch((error) => { console.error(error); app.exit(1); });
