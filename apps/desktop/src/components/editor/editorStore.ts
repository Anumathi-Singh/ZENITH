import { create } from "zustand";

export interface FileTab {
  id: string;
  name: string;
  language: string;
  content: string;
  isDirty?: boolean;
}

interface EditorStore {
  tabs: FileTab[];
  activeTab: string;

  openTab: (tab: FileTab) => void;
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
}


export const useEditorStore = create<EditorStore>((set) => ({

  tabs: [
    {
      id: "app",
      name: "App.tsx",
      language: "typescript",
      isDirty: false,
      content: `export default function App() {
  return <h1>Hello Zenith 🚀</h1>;
}`,
    },
  ],


  activeTab: "app",


  openTab: (tab) =>
    set((state) => {

      const exists = state.tabs.find(
        (t) => t.id === tab.id
      );


      if (exists) {
        return {
          activeTab: tab.id,
        };
      }


      return {
        tabs: [
          ...state.tabs,
          {
            ...tab,
            isDirty: false,
          },
        ],
        activeTab: tab.id,
      };

    }),



  setActiveTab: (id) =>
    set({
      activeTab: id,
    }),



  closeTab: (id) =>
    set((state) => {

      const tabs = state.tabs.filter(
        (tab) => tab.id !== id
      );


      return {
        tabs,

        activeTab:
          state.activeTab === id
            ? tabs[0]?.id ?? ""
            : state.activeTab,
      };

    }),




  updateContent: (id, content) =>
    set((state) => ({

      tabs: state.tabs.map((tab) =>

        tab.id === id

          ? {
              ...tab,
              content,
              isDirty: true,
            }

          : tab

      ),

    })),




  markSaved: (id) =>
    set((state) => ({

      tabs: state.tabs.map((tab) =>

        tab.id === id

          ? {
              ...tab,
              isDirty: false,
            }

          : tab

      ),

    })),

}));