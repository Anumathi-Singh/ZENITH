import { create } from "zustand";
import type { FileNode } from "./treeData";
import { fileIdentity, useEditorStore, type FileTab } from "../editor/editorStore";
import type { ZenithDirectoryEntry } from "../../types/zenith-desktop";
import { notify } from "../ui/uiStore";

export type WorkspaceNode = FileNode & { path: string; loaded?: boolean };

interface WorkspaceStore {
  rootName: string;
  rootPath: string | null;
  tree: WorkspaceNode[];
  message: string;
  openFolder: () => Promise<void>;
  openClonedFolder: (folderPath: string) => Promise<void>;
  closeFolder: () => Promise<void>;
  loadDirectory: (directoryPath: string, parentId?: string) => Promise<void>;
  openFile: (node: WorkspaceNode) => Promise<FileTab | null>;
  openFilePath: (filePath: string, name?: string) => Promise<FileTab | null>;
  refresh: () => Promise<void>;
}

const languageFor = (name: string) => ({ ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", json: "json", css: "css", scss: "scss", html: "html", md: "markdown", yml: "yaml", yaml: "yaml", xml: "xml", py: "python", java: "java", cs: "csharp", rs: "rust", go: "go", sh: "shell", ps1: "powershell" }[name.split(".").pop()?.toLowerCase() ?? ""] ?? "plaintext");
const idFor = (filePath: string) => `file:${fileIdentity(filePath)}`;
const toNodes = (entries: ZenithDirectoryEntry[]): WorkspaceNode[] => entries.map((entry) => ({ id: idFor(entry.path), name: entry.name, path: entry.path, type: entry.type, language: entry.type === "file" ? languageFor(entry.name) : undefined, children: entry.type === "folder" ? [] : undefined, loaded: entry.type === "file" })).sort((left, right) => Number(right.type === "folder") - Number(left.type === "folder") || left.name.localeCompare(right.name));

function replaceDirectory(nodes: WorkspaceNode[], parentId: string, children: WorkspaceNode[]): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children, loaded: true };
    if (node.children) return { ...node, children: replaceDirectory(node.children as WorkspaceNode[], parentId, children) };
    return node;
  });
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  rootName: "No Folder Open",
  rootPath: null,
  tree: [],
  message: "Open a project folder to begin.",
  openFolder: async () => {
    if (!useEditorStore.getState().canLeaveWorkspace()) return;
    if (!window.zenithDesktop) {
      set({ message: "Desktop filesystem bridge is unavailable. Start Zenith with npm run desktop:dev." });
      return;
    }
    try {
      const selected = await window.zenithDesktop.selectFolder();
      if (!selected) return;
      useEditorStore.getState().clearTabs();
      set({ rootName: selected.name, rootPath: selected.path, tree: [], message: `Opening ${selected.name}…` });
      await get().loadDirectory(selected.path);
      notify(`${selected.name} opened.`, "success");
    } catch (error) {
      set({ message: error instanceof Error ? error.message : "Could not open the selected folder." });
    }
  },
  openClonedFolder: async (folderPath) => {
    if (!useEditorStore.getState().canLeaveWorkspace()) return;
    const api = window.zenithDesktop?.github;
    if (!api) return;
    try {
      const result = await api.openClonedWorkspace(folderPath);
      if (!result.ok) throw new Error(result.error.message);
      const workspace = result.data;
      useEditorStore.getState().clearTabs();
      set({ rootName: workspace.name, rootPath: workspace.path, tree: [], message: `Opening ${workspace.name}…` });
      await get().loadDirectory(workspace.path);
      notify(`${workspace.name} opened.`, "success");
    } catch (error) {
      set({ message: error instanceof Error ? error.message : "Could not open the cloned repository." });
      notify(error instanceof Error ? error.message : "Could not open the cloned repository.", "error");
    }
  },
  closeFolder: async () => {
    if (!useEditorStore.getState().canLeaveWorkspace()) return;
    await window.zenithDesktop?.closeWorkspace();
    useEditorStore.getState().clearTabs();
    set({ rootName: "No Folder Open", rootPath: null, tree: [], message: "Workspace closed." });
    notify("Workspace closed.", "info");
  },
  loadDirectory: async (directoryPath, parentId) => {
    if (!window.zenithDesktop) return;
    const requestedRoot = get().rootPath;
    try {
      const children = toNodes(await window.zenithDesktop.readDirectory(directoryPath));
      if (get().rootPath !== requestedRoot) return;
      set((state) => parentId ? { tree: replaceDirectory(state.tree, parentId, children), message: "Folder loaded." } : { tree: children, message: `${state.rootName} is ready.` });
    } catch (error) {
      set({ message: error instanceof Error ? error.message : "Could not read this directory." });
    }
  },
  openFile: async (node) => node.type === "file" ? get().openFilePath(node.path, node.name) : null,
  openFilePath: async (filePath, name) => {
    if (!window.zenithDesktop) return null;
    const existing = useEditorStore.getState().tabs.find((tab) => tab.path && fileIdentity(tab.path) === fileIdentity(filePath));
    if (existing) return existing;
    const requestedRoot = get().rootPath;
    try {
      const fileName = name || filePath.split(/[\\/]/).pop() || filePath;
      const content = await window.zenithDesktop.readFile(filePath);
      if (get().rootPath !== requestedRoot) return null;
      return { id: idFor(filePath), name: fileName, path: filePath, language: languageFor(fileName), content };
    } catch (error) {
      set({ message: error instanceof Error ? error.message : "Could not read this file." });
      return null;
    }
  },
  refresh: async () => {
    const { rootPath, rootName } = get();
    if (!rootPath) { set({ message: "Open a folder to refresh its files." }); return; }
    set({ message: `Refreshing ${rootName}…` });
    await get().loadDirectory(rootPath);
    void window.zenithDesktop?.workspaceIndex.rebuild();
  },
}));


