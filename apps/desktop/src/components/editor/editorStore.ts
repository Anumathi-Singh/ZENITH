import { create } from "zustand";

export interface FileTab { id: string; name: string; language: string; content: string; isDirty?: boolean; fileHandle?: { createWritable: () => Promise<{ write: (content: string) => Promise<void>; close: () => Promise<void> }> }; }
interface EditorStore { tabs: FileTab[]; activeTab: string; saveMessage: string; openTab: (tab: FileTab) => void; setActiveTab: (id: string) => void; closeTab: (id: string) => void; updateContent: (id: string, content: string) => void; saveTab: (id: string) => Promise<void>; }

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [{ id: "app", name: "App.tsx", language: "typescript", isDirty: false, content: `export default function App() {\n  return <h1>Hello Zenith 🚀</h1>;\n}` }], activeTab: "app", saveMessage: "All changes saved",
  openTab: (tab) => set((state) => state.tabs.some((item) => item.id === tab.id) ? { activeTab: tab.id } : { tabs: [...state.tabs, { ...tab, isDirty: false }], activeTab: tab.id }),
  setActiveTab: (id) => set({ activeTab: id }),
  closeTab: (id) => set((state) => { const tabs = state.tabs.filter((tab) => tab.id !== id); return { tabs, activeTab: state.activeTab === id ? tabs[0]?.id ?? "" : state.activeTab }; }),
  updateContent: (id, content) => set((state) => ({ tabs: state.tabs.map((tab) => tab.id === id ? { ...tab, content, isDirty: true } : tab), saveMessage: "Unsaved changes" })),
  saveTab: async (id) => { const tab = get().tabs.find((item) => item.id === id); if (!tab) return; set({ saveMessage: "Saving…" }); try { if (tab.fileHandle) { const writable = await tab.fileHandle.createWritable(); await writable.write(tab.content); await writable.close(); } else { const url = URL.createObjectURL(new Blob([tab.content], { type: "text/plain" })); const download = document.createElement("a"); download.href = url; download.download = tab.name; download.click(); URL.revokeObjectURL(url); } set((state) => ({ tabs: state.tabs.map((item) => item.id === id ? { ...item, isDirty: false } : item), saveMessage: tab.fileHandle ? `Saved ${tab.name}` : `Downloaded ${tab.name}` })); } catch { set({ saveMessage: "Could not save this file" }); } },
}));
