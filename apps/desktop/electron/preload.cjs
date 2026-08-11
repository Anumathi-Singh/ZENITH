const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zenithDesktop", {
  selectFolder: () => ipcRenderer.invoke("zenith:select-folder"),
  readDirectory: (directoryPath) => ipcRenderer.invoke("zenith:read-directory", directoryPath),
  readFile: (filePath) => ipcRenderer.invoke("zenith:read-file", filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke("zenith:write-file", filePath, content),
});
