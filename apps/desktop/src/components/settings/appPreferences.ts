import { create } from "zustand";

export type Density = "compact" | "comfortable";
export type StartBehavior = "welcome" | "restore";

export interface AppPreferences {
  density: Density;
  animations: boolean;
  reducedMotion: boolean;
  panelBorders: boolean;
  startBehavior: StartBehavior;
  showAiOnStartup: boolean;
  defaultAgent: "Planner" | "Coder" | "Reviewer" | "Tester" | "Docs";
  defaultTerminalProfile: string;
  copyOnSelection: boolean;
  confirmBeforeClosingDirtyFiles: boolean;
  anonymousDiagnostics: boolean;
  crashReports: boolean;
  setPreference: <K extends keyof Omit<AppPreferences, "setPreference">>(key: K, value: AppPreferences[K]) => void;
}

type SavedPreferences = Omit<AppPreferences, "setPreference">;
const storageKey = "zenith-preferences";
const defaults: SavedPreferences = {
  density: "comfortable", animations: true, reducedMotion: false, panelBorders: true,
  startBehavior: "restore", showAiOnStartup: true, defaultAgent: "Coder", defaultTerminalProfile: "",
  copyOnSelection: false, confirmBeforeClosingDirtyFiles: true, anonymousDiagnostics: false, crashReports: false,
};

function loadPreferences(): SavedPreferences {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? { ...defaults, ...JSON.parse(value) } : defaults;
  } catch { return defaults; }
}

export const useAppPreferences = create<AppPreferences>((set, get) => ({
  ...loadPreferences(),
  setPreference: (key, value) => {
    set({ [key]: value } as Pick<AppPreferences, typeof key>);
    const current = get();
    const preferences: SavedPreferences = { density: current.density, animations: current.animations, reducedMotion: current.reducedMotion, panelBorders: current.panelBorders, startBehavior: current.startBehavior, showAiOnStartup: current.showAiOnStartup, defaultAgent: current.defaultAgent, defaultTerminalProfile: current.defaultTerminalProfile, copyOnSelection: current.copyOnSelection, confirmBeforeClosingDirtyFiles: current.confirmBeforeClosingDirtyFiles, anonymousDiagnostics: current.anonymousDiagnostics, crashReports: current.crashReports };
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* storage is optional */ }
  },
}));


