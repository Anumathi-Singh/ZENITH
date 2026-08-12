const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zenithDesktop", {
  selectFolder: () => ipcRenderer.invoke("zenith:select-folder"),
  readDirectory: (directoryPath) => ipcRenderer.invoke("zenith:read-directory", directoryPath),
  closeWorkspace: () => ipcRenderer.invoke("zenith:close-folder"),
  readFile: (filePath) => ipcRenderer.invoke("zenith:read-file", filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke("zenith:write-file", filePath, content),
  revealPath: (filePath) => ipcRenderer.invoke("zenith:reveal-path", filePath),
  copyText: (text) => ipcRenderer.invoke("zenith:copy-text", text),
  getTerminalProfiles: () => ipcRenderer.invoke("zenith:terminal-profiles"),
  createTerminal: (profileId) => ipcRenderer.invoke("zenith:terminal-create", profileId),
  terminalInput: (id, data) => ipcRenderer.invoke("zenith:terminal-input", id, data),
  terminalResize: (id, cols, rows) => ipcRenderer.invoke("zenith:terminal-resize", id, cols, rows),
  killTerminal: (id) => ipcRenderer.invoke("zenith:terminal-kill", id),
  minimizeWindow: () => ipcRenderer.invoke("zenith:window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("zenith:window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("zenith:window-close"),
  onTerminalData: (listener) => { const handler = (_event, payload) => listener(payload); ipcRenderer.on("zenith:terminal-data", handler); return () => ipcRenderer.removeListener("zenith:terminal-data", handler); },
  onTerminalExit: (listener) => { const handler = (_event, payload) => listener(payload); ipcRenderer.on("zenith:terminal-exit", handler); return () => ipcRenderer.removeListener("zenith:terminal-exit", handler); },
});



