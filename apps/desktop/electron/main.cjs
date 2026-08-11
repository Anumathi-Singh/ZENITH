const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

let mainWindow;
let workspaceRoot = null;
const ignoredNames = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);
const maxFileBytes = 2 * 1024 * 1024;

function assertWorkspacePath(candidate) {
  if (!workspaceRoot) throw new Error("No workspace is open.");
  const resolved = path.resolve(candidate);
  const relative = path.relative(workspaceRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Path is outside the selected workspace.");
  return resolved;
}

async function readDirectory(directoryPath) {
  const resolved = assertWorkspacePath(directoryPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return entries
    .filter((entry) => !ignoredNames.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => ({
      name: entry.name,
      path: path.join(resolved, entry.name),
      type: entry.isDirectory() ? "folder" : "file",
    }))
    .sort((left, right) => Number(right.type === "folder") - Number(left.type === "folder") || left.name.localeCompare(right.name));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 680,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) mainWindow.loadURL(devServerUrl);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("zenith:select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
    if (result.canceled || !result.filePaths[0]) return null;
    workspaceRoot = path.resolve(result.filePaths[0]);
    return { path: workspaceRoot, name: path.basename(workspaceRoot) };
  });

  ipcMain.handle("zenith:read-directory", async (_event, directoryPath) => readDirectory(directoryPath));
  ipcMain.handle("zenith:read-file", async (_event, filePath) => {
    const resolved = assertWorkspacePath(filePath);
    const info = await fs.stat(resolved);
    if (!info.isFile()) throw new Error("Requested path is not a file.");
    if (info.size > maxFileBytes) throw new Error("File is too large to open in Zenith.");
    return fs.readFile(resolved, "utf8");
  });
  ipcMain.handle("zenith:write-file", async (_event, filePath, content) => {
    const resolved = assertWorkspacePath(filePath);
    await fs.writeFile(resolved, content, "utf8");
  });

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
