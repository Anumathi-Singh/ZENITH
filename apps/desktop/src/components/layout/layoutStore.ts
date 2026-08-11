import { create } from "zustand";

export type PanelType = "explorer" | "nova" | "search" | "git" | "settings" | null;

interface LayoutStore {
  activePanel: PanelType;
  isAiPanelOpen: boolean;
  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: Exclude<PanelType, null>) => void;
  setAiPanelOpen: (isOpen: boolean) => void;
  toggleAiPanel: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  activePanel: "explorer",
  isAiPanelOpen: true,
  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setAiPanelOpen: (isOpen) => set({ isAiPanelOpen: isOpen }),
  toggleAiPanel: () => set((state) => ({ isAiPanelOpen: !state.isAiPanelOpen })),
}));
