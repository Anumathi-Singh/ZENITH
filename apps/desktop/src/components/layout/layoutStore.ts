import { create } from "zustand";

export type PanelType = "explorer" | "nova" | "search" | "git" | "settings" | null;

const MIN_PANEL_WIDTH = 220;
const MAX_PANEL_WIDTH = 520;

interface LayoutStore {
  activePanel: PanelType;
  sidePanelWidth: number;
  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: Exclude<PanelType, null>) => void;
  setSidePanelWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  activePanel: "explorer",
  sidePanelWidth: 280,
  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setSidePanelWidth: (width) => set({ sidePanelWidth: Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, Math.round(width))) }),
}));
