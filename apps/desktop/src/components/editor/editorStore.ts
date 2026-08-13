import { create } from "zustand";

export interface FileTab {
  id: string;
  name: string;
  path?: string;
  language: string;
  content: string;
  isDirty?: boolean;
}

interface EditorStore {
  tabs: FileTab[];
  activeTab: string;
  saveMessage: string;
  openTab: (tab: FileTab) => void;
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  saveTab: (id: string) => Promise<void>;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTab: "",
  saveMessage: "No file open",
  openTab: (tab) => set((state) => {
    if (state.tabs.some((item) => item.id === tab.id)) return { activeTab: tab.id };
    return { tabs: [...state.tabs, { ...tab, isDirty: false }], activeTab: tab.id, saveMessage: "Saved" };
  }),
  setActiveTab: (id) => set({ activeTab: id }),
  closeTab: (id) => set((state) => {
    const tabs = state.tabs.filter((tab) => tab.id !== id);
    const activeTab = state.activeTab === id ? tabs[0]?.id ?? "" : state.activeTab;
    const activeFile = tabs.find((tab) => tab.id === activeTab);
    return { tabs, activeTab, saveMessage: activeFile?.isDirty ? "Modified" : activeFile ? "Saved" : "No file open" };
  }),
  updateContent: (id, content) => set((state) => ({ tabs: state.tabs.map((tab) => tab.id === id ? { ...tab, content, isDirty: true } : tab), saveMessage: "Modified" })),
  saveTab: async (id) => {
    const tab = get().tabs.find((item) => item.id === id);
    if (!tab) return;
    if (!tab.path || !window.zenithDesktop) {
      set({ saveMessage: "This file cannot be saved outside the desktop workspace." });
      return;
    }

    set({ saveMessage: "Saving…" });
    try {
      await window.zenithDesktop.writeFile(tab.path, tab.content);
      set((state) => ({ tabs: state.tabs.map((item) => item.id === id ? { ...item, isDirty: false } : item), saveMessage: "Saved" }));
    } catch (error) {
      set({ saveMessage: error instanceof Error ? error.message : "Could not save this file." });
    }
  },
}));
