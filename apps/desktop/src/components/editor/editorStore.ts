import { create } from "zustand";
import { useAppPreferences } from "../settings/appPreferences";

export interface FileTab {
  id: string;
  name: string;
  path?: string;
  language: string;
  content: string;
  savedContent?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  saveError?: string;
}

export function fileIdentity(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.match(/^[a-z]:\//i) ? normalized.toLowerCase() : normalized;
}
export function fileSaveState(tab?: FileTab) {
  return !tab ? "No file open" : tab.saveError || (tab.isSaving ? "Saving…" : tab.isDirty ? "Modified" : "Saved");
}
interface EditorStore {
  tabs: FileTab[];
  activeTab: string;
  saveMessage: string;
  revealRequest: { tabId: string; line: number; column: number; nonce: number } | null;
  openTab: (tab: FileTab) => void;
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  clearTabs: () => void;
  canLeaveWorkspace: () => boolean;
  updateContent: (id: string, content: string) => void;
  saveTab: (id: string) => Promise<void>;
  revealLocation: (tabId: string, line: number, column: number) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [], activeTab: "", saveMessage: "No file open", revealRequest: null,
  openTab: (tab) => set((state) => {
    const existing = state.tabs.find((item) => item.id === tab.id || (item.path && tab.path && fileIdentity(item.path) === fileIdentity(tab.path)));
    if (existing) return { activeTab: existing.id, saveMessage: fileSaveState(existing) };
    return { tabs: [...state.tabs, { ...tab, savedContent: tab.content, isDirty: false }], activeTab: tab.id, saveMessage: "Saved" };
  }),
  setActiveTab: (id) => {
    const tab = get().tabs.find((item) => item.id === id);
    if (tab) set({ activeTab: id, saveMessage: fileSaveState(tab) });
  },
  closeTab: (id) => {
    const current = get().tabs.find((tab) => tab.id === id);
    if (current?.isSaving) return;
    if (current?.isDirty && useAppPreferences.getState().confirmBeforeClosingDirtyFiles &&
      !window.confirm(`Discard unsaved changes to ${current.name}? This cannot be undone.`)) return;
    set((state) => {
      const tabs = state.tabs.filter((tab) => tab.id !== id);
      const activeTab = state.activeTab === id ? tabs[0]?.id ?? "" : state.activeTab;
      return { tabs, activeTab, saveMessage: fileSaveState(tabs.find((tab) => tab.id === activeTab)) };
    });
  },
  canLeaveWorkspace: () => {
    if (get().tabs.some((tab) => tab.isSaving)) { window.alert("Wait for the current save to finish before changing workspaces."); return false; }
    return !get().tabs.some((tab) => tab.isDirty) || window.confirm("Changing the workspace will discard unsaved files. Continue?");
  },
  clearTabs: () => set({ tabs: [], activeTab: "", revealRequest: null, saveMessage: "No file open" }),
  updateContent: (id, content) => set((state) => {
    const tabs = state.tabs.map((tab) => tab.id === id ? { ...tab, content, isDirty: content !== tab.savedContent, saveError: undefined } : tab);
    return { tabs, saveMessage: fileSaveState(tabs.find((tab) => tab.id === state.activeTab)) };
  }),
  saveTab: async (id) => {
    const tab = get().tabs.find((item) => item.id === id);
    // One write per tab at a time. A second shortcut cannot overtake the first save.
    if (!tab || tab.isSaving) return;
    const change = (patch: Partial<FileTab>) => set((state) => {
      const tabs = state.tabs.map((item) => item.id === id ? { ...item, ...patch } : item);
      return { tabs, saveMessage: fileSaveState(tabs.find((item) => item.id === state.activeTab)) };
    });
    if (!tab.path || !window.zenithDesktop) {
      change({ saveError: "This file cannot be saved outside the desktop workspace." }); return;
    }
    change({ isSaving: true, saveError: undefined });
    try {
      await window.zenithDesktop.writeFile(tab.path, tab.content);
      const current = get().tabs.find((item) => item.id === id);
      change({ isSaving: false, savedContent: tab.content, isDirty: current?.content !== tab.content });
    } catch (error) {
      change({ isSaving: false, saveError: error instanceof Error ? error.message : "Could not save this file." });
    }
  },
  revealLocation: (tabId, line, column) => set({ activeTab: tabId, revealRequest: { tabId, line: Math.max(1, line), column: Math.max(1, column), nonce: Date.now() } }),
}));
