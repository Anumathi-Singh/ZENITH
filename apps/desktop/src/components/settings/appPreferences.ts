import { create } from "zustand";

export type Density = "compact" | "comfortable";
export type StartBehavior = "welcome" | "restore";
export interface AppPreferences {
  density: Density; animations: boolean; reducedMotion: boolean; panelBorders: boolean;
  panelTransparency: boolean; startBehavior: StartBehavior;
  showAiOnStartup: boolean; defaultAgent: "Planner" | "Coder" | "Reviewer" | "Tester" | "Docs";
  defaultTerminalProfile: string; copyOnSelection: boolean; confirmBeforeClosingDirtyFiles: boolean;
  anonymousDiagnostics: boolean; crashReports: boolean;
  setPreference: <K extends keyof Omit<AppPreferences, "setPreference">>(key: K, value: AppPreferences[K]) => void;
}
type SavedPreferences = Omit<AppPreferences, "setPreference">;
const storageKey = "zenith-preferences";
const defaults: SavedPreferences = {
  density: "comfortable", animations: true, reducedMotion: false, panelBorders: true,
  panelTransparency: true, startBehavior: "restore", showAiOnStartup: true,
  defaultAgent: "Coder", defaultTerminalProfile: "", copyOnSelection: false,
  confirmBeforeClosingDirtyFiles: true, anonymousDiagnostics: false, crashReports: false,
};
function loadPreferences(): SavedPreferences {
  try {
    const value = localStorage.getItem(storageKey);
    const parsed: unknown = value ? JSON.parse(value) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
    const stored = parsed as Record<string, unknown>;
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof SavedPreferences)[]) {
      const candidate = stored[key];
      if (typeof defaults[key] === "boolean" && typeof candidate === "boolean") Object.assign(result, { [key]: candidate });
    }
    if (stored.density === "compact" || stored.density === "comfortable") result.density = stored.density;
    if (stored.startBehavior === "welcome" || stored.startBehavior === "restore") result.startBehavior = stored.startBehavior;
    if (["Planner", "Coder", "Reviewer", "Tester", "Docs"].includes(String(stored.defaultAgent))) result.defaultAgent = stored.defaultAgent as SavedPreferences["defaultAgent"];
    if (typeof stored.defaultTerminalProfile === "string") result.defaultTerminalProfile = stored.defaultTerminalProfile;
    return result;
  }
  catch { return defaults; }
}
const savedPreferences = (current: AppPreferences): SavedPreferences => ({
  density: current.density, animations: current.animations, reducedMotion: current.reducedMotion,
  panelBorders: current.panelBorders, panelTransparency: current.panelTransparency,
  startBehavior: current.startBehavior,
  showAiOnStartup: current.showAiOnStartup, defaultAgent: current.defaultAgent,
  defaultTerminalProfile: current.defaultTerminalProfile, copyOnSelection: current.copyOnSelection,
  confirmBeforeClosingDirtyFiles: current.confirmBeforeClosingDirtyFiles,
  anonymousDiagnostics: current.anonymousDiagnostics, crashReports: current.crashReports,
});
export const useAppPreferences = create<AppPreferences>((set, get) => ({
  ...loadPreferences(),
  setPreference: (key, value) => {
    set({ [key]: value } as Pick<AppPreferences, typeof key>);
    try { localStorage.setItem(storageKey, JSON.stringify(savedPreferences(get()))); } catch { /* optional */ }
  },
}));
