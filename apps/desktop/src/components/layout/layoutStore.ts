import { create } from "zustand";

export type PanelType = "explorer" | "search" | "git" | "settings" | "extensions" | null;

const MIN_LEFT_PANEL_WIDTH = 220;
const MAX_LEFT_PANEL_WIDTH = 520;
const MIN_AI_PANEL_WIDTH = 280;
const MAX_AI_PANEL_WIDTH = 560;

interface LayoutStore {
  activePanel: PanelType;
  sidePanelWidth: number;
  aiPanelOpen: boolean;
  aiPanelWidth: number;
  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: Exclude<PanelType, null>) => void;
  setSidePanelWidth: (width: number) => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  activePanel: "explorer",
  sidePanelWidth: 280,
  aiPanelOpen: true,
  aiPanelWidth: 340,
  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setSidePanelWidth: (width) => set({ sidePanelWidth: Math.min(MAX_LEFT_PANEL_WIDTH, Math.max(MIN_LEFT_PANEL_WIDTH, Math.round(width))) }),
  setAIPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  setAIPanelWidth: (width) => set({ aiPanelWidth: Math.min(MAX_AI_PANEL_WIDTH, Math.max(MIN_AI_PANEL_WIDTH, Math.round(width))) }),
}));

