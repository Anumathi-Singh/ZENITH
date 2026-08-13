const { app, BrowserWindow, clipboard, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");
const pty = require("node-pty");
const { asBackendResult } = require("./services/backend-result.cjs");
const { GitService } = require("./services/git-service.cjs");
const { WorkspaceService } = require("./services/workspace-service.cjs");

let mainWindow;
const workspaceService = new WorkspaceService();
const gitService = new GitService(workspaceService);
const terminals = new Map();
const ignoredNames = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const maxFileBytes = 2 * 1024 * 1024;

function assertWorkspacePath(candidate) {
  return workspaceService.assertPath(candidate);
}

async function readDirectory(directoryPath) {
  const resolved = await workspaceService.assertExistingPath(directoryPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return entries
    .filter((entry) => !ignoredNames.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => ({ name: entry.name, path: path.join(resolved, entry.name), type: entry.isDirectory() ? "folder" : "file" }))
    .sort((left, right) => Number(right.type === "folder") - Number(left.type === "folder") || left.name.localeCompare(right.name));
}

function fileExists(filePath) {
  return typeof filePath === "string" && filePath.length > 0 && fsSync.existsSync(filePath);
}

function firstExisting(candidates) {
  return candidates.find((candidate) => fileExists(candidate));
}

function executableOnPath(fileName) {
  const directories = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
  return firstExisting(directories.map((directory) => path.join(directory.replace(/^"|"$/g, ""), fileName)));
}

function hasWslDistribution(systemRoot, wslExecutable) {
  if (!wslExecutable) return false;
  try {
    const registry = childProcess.execFileSync(path.join(systemRoot, "System32", "reg.exe"), ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss", "/s"], { encoding: "utf8", windowsHide: true, timeout: 1500, stdio: ["ignore", "pipe", "ignore"] });
    return /DistributionName\s+REG_SZ\s+\S+/i.test(registry);
  } catch {
    return false;
  }
}

function terminalProfiles() {
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot || "C:\\Windows";
    const programFiles = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean);
    const commandPrompt = firstExisting([process.env.ComSpec, path.join(systemRoot, "System32", "cmd.exe"), executableOnPath("cmd.exe")]);
    const powershell = firstExisting([path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"), executableOnPath("powershell.exe")]);
    const powershell7 = firstExisting([path.join(process.env.ProgramFiles || "", "PowerShell", "7", "pwsh.exe"), executableOnPath("pwsh.exe")]);
    const gitBashCandidates = [
      ...programFiles.map((directory) => path.join(directory, "Git", "bin", "bash.exe")),
      path.join(process.env.LOCALAPPDATA || "", "Programs", "Git", "bin", "bash.exe"),
    ];
    const gitExecutable = executableOnPath("git.exe");
    if (gitExecutable) gitBashCandidates.push(path.resolve(path.dirname(gitExecutable), "..", "bin", "bash.exe"));
    const gitBash = firstExisting(gitBashCandidates);
    const wslCandidate = firstExisting([path.join(systemRoot, "System32", "wsl.exe"), executableOnPath("wsl.exe")]);
    const wsl = hasWslDistribution(systemRoot, wslCandidate) ? wslCandidate : undefined;
    const nuShell = executableOnPath("nu.exe");
    const profiles = [
      { id: "powershell", label: "PowerShell", executable: powershell, args: ["-NoLogo"] },
      { id: "command-prompt", label: "Command Prompt", executable: commandPrompt, args: [] },
      { id: "powershell-7", label: "PowerShell 7", executable: powershell7, args: ["-NoLogo"] },
      { id: "git-bash", label: "Git Bash", executable: gitBash, args: ["--login"] },
      { id: "wsl", label: "WSL", executable: wsl, args: [] },
      { id: "nushell", label: "NuShell", executable: nuShell, args: [] },
    ];
    return profiles.filter((profile) => fileExists(profile.executable));
  }

  const shell = process.env.SHELL || "/bin/bash";
  return fileExists(shell) ? [{ id: "system-shell", label: path.basename(shell), executable: shell, args: [] }] : [];
}

function publicProfile(profile) {
  return { id: profile.id, label: profile.label, shell: path.basename(profile.executable) };
}

function resolveProfile(profileId) {
  const profiles = terminalProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId) || profiles[0];
  if (!profile) throw new Error("No supported terminal shell was found on this computer.");
  return profile;
}

function killTerminal(id) {
  const session = terminals.get(id);
  if (!session) return;
  terminals.delete(id);
  try { session.process.kill(); } catch { /* process already exited */ }
}

function killAllTerminals() {
  for (const id of terminals.keys()) killTerminal(id);
}

let gitRefreshTimer;
function notifyGitStatusChanged() {
  clearTimeout(gitRefreshTimer);
  gitRefreshTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("zenith:git-status-changed");
  }, 180);
}

function gitHandler(channel, operation, fallbackCode = "GIT_OPERATION_FAILED") {
  ipcMain.handle(channel, (_event, ...args) => asBackendResult(async () => {
    const data = await operation(...args);
    if (channel !== "zenith:git-status" && channel !== "zenith:git-version" && channel !== "zenith:git-branches" && channel !== "zenith:git-remotes" && channel !== "zenith:git-history") notifyGitStatusChanged();
    return data;
  }, fallbackCode));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Zenith",
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 680,
    icon: path.join(__dirname, "..", "src", "assets", "logo", "app-icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, "preload.cjs") },
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) mainWindow.loadURL(devServerUrl);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  mainWindow.on("closed", () => { killAllTerminals(); mainWindow = undefined; });
}

app.whenReady().then(() => {
  ipcMain.handle("zenith:select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths[0]) return null;
    const workspace = await workspaceService.open(result.filePaths[0]);
    notifyGitStatusChanged();
    return workspace;
  });
  ipcMain.handle("zenith:read-directory", async (_event, directoryPath) => readDirectory(directoryPath));
  ipcMain.handle("zenith:close-folder", () => { workspaceService.close(); notifyGitStatusChanged(); });
  ipcMain.handle("zenith:read-file", async (_event, filePath) => {
    const resolved = await workspaceService.assertExistingPath(filePath);
    const info = await fs.stat(resolved);
    if (!info.isFile()) throw new Error("Requested path is not a file.");
    if (info.size > maxFileBytes) throw new Error("File is too large to open in Zenith.");
    return fs.readFile(resolved, "utf8");
  });
  ipcMain.handle("zenith:write-file", async (_event, filePath, content) => {
    const resolved = await workspaceService.assertExistingPath(filePath);
    await fs.writeFile(resolved, content, "utf8");
    notifyGitStatusChanged();
  });
  ipcMain.handle("zenith:reveal-path", async (_event, candidate) => { shell.showItemInFolder(await workspaceService.assertExistingPath(candidate)); });
  ipcMain.handle("zenith:copy-text", (_event, text) => { clipboard.writeText(String(text ?? "")); });
  ipcMain.handle("zenith:terminal-profiles", () => terminalProfiles().map(publicProfile));
  ipcMain.handle("zenith:terminal-create", (event, profileId) => {
    const id = `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const profile = resolveProfile(profileId);
    const cwd = workspaceService.getRoot() || os.homedir();
    try {
      const ptyProcess = pty.spawn(profile.executable, profile.args, {
        name: "xterm-256color",
        cols: 100,
        rows: 20,
        cwd,
        env: { ...process.env, TERM: "xterm-256color" },
      });
      terminals.set(id, { process: ptyProcess, sender: event.sender });
      ptyProcess.onData((data) => {
        if (!event.sender.isDestroyed()) event.sender.send("zenith:terminal-data", { id, data });
      });
      ptyProcess.onExit(({ exitCode, signal }) => {
        terminals.delete(id);
        if (!event.sender.isDestroyed()) event.sender.send("zenith:terminal-exit", { id, exitCode, signal });
      });
      return { id, cwd, profileId: profile.id, profileLabel: profile.label, shell: path.basename(profile.executable) };
    } catch (error) {
      throw new Error(`Could not start shell: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  ipcMain.handle("zenith:terminal-input", (_event, id, data) => {
    const session = terminals.get(id);
    if (!session) throw new Error("Terminal session is not running.");
    session.process.write(data);
  });
  ipcMain.handle("zenith:terminal-resize", (_event, id, cols, rows) => {
    const session = terminals.get(id);
    if (session && cols > 0 && rows > 0) session.process.resize(cols, rows);
  });
  ipcMain.handle("zenith:terminal-kill", (_event, id) => killTerminal(id));
  ipcMain.handle("zenith:window-minimize", () => mainWindow?.minimize());
  ipcMain.handle("zenith:window-toggle-maximize", () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
  ipcMain.handle("zenith:window-close", () => mainWindow?.close());
  gitHandler("zenith:git-version", () => gitService.getVersion(), "GIT_UNAVAILABLE");
  gitHandler("zenith:git-status", () => gitService.status());
  gitHandler("zenith:git-stage", (paths) => gitService.stage(Array.isArray(paths) ? paths : []));
  gitHandler("zenith:git-unstage", (paths) => gitService.unstage(Array.isArray(paths) ? paths : []));
  gitHandler("zenith:git-stage-all", () => gitService.stageAll());
  gitHandler("zenith:git-unstage-all", () => gitService.unstageAll());
  gitHandler("zenith:git-commit", (message) => gitService.commit(message));
  gitHandler("zenith:git-fetch", () => gitService.fetch());
  gitHandler("zenith:git-pull", () => gitService.pull());
  gitHandler("zenith:git-push", () => gitService.push());
  gitHandler("zenith:git-branches", () => gitService.branches());
  gitHandler("zenith:git-checkout-branch", (name) => gitService.checkoutBranch(name));
  gitHandler("zenith:git-create-branch", (name) => gitService.createBranch(name));
  gitHandler("zenith:git-remotes", () => gitService.remotes());
  gitHandler("zenith:git-history", (limit, skip) => gitService.history(limit, skip));
  gitHandler("zenith:git-init", () => gitService.init());
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("before-quit", () => { clearTimeout(gitRefreshTimer); killAllTerminals(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });



