import { create } from "zustand";

export type PanelType =
  | "explorer"
  | "nova"
  | "search"
  | "git"
  | "settings"
  | null;

interface LayoutStore {
  activePanel: PanelType;

  setActivePanel: (panel: PanelType) => void;

  togglePanel: (panel: Exclude<PanelType, null>) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  activePanel: "explorer",

  setActivePanel: (panel) =>
    set({
      activePanel: panel,
    }),

  togglePanel: (panel) =>
    set((state) => ({
      activePanel:
        state.activePanel === panel
          ? null
          : panel,
    })),
}));