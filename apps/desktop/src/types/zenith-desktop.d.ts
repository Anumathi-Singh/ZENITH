export interface ZenithDirectoryEntry {
  name: string;
  path: string;
  type: "file" | "folder";
}

export interface ZenithDesktopApi {
  selectFolder: () => Promise<{ path: string; name: string } | null>;
  readDirectory: (directoryPath: string) => Promise<ZenithDirectoryEntry[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
}

declare global {
  interface Window {
    zenithDesktop?: ZenithDesktopApi;
  }
}

export {};
