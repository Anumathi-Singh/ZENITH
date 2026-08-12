export interface ZenithDirectoryEntry { name: string; path: string; type: "file" | "folder"; }
export interface ZenithTerminalProfile { id: string; label: string; shell: string; }
export interface ZenithTerminalSession { id: string; cwd: string; profileId: string; profileLabel: string; shell: string; }
export interface ZenithDesktopApi {
  selectFolder: () => Promise<{ path: string; name: string } | null>;
  readDirectory: (directoryPath: string) => Promise<ZenithDirectoryEntry[]>;
  closeWorkspace: () => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  revealPath: (filePath: string) => Promise<void>;
  copyText: (text: string) => Promise<void>;
  getTerminalProfiles: () => Promise<ZenithTerminalProfile[]>;
  createTerminal: (profileId?: string) => Promise<ZenithTerminalSession>;
  terminalInput: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  killTerminal: (id: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  onTerminalData: (listener: (payload: { id: string; data: string }) => void) => () => void;
  onTerminalExit: (listener: (payload: { id: string; exitCode: number; signal?: number }) => void) => () => void;
}
declare global { interface Window { zenithDesktop?: ZenithDesktopApi; } }
export {};



