export type ThemeName = "light" | "dark" | "aurora" | "sakura" | "midnight" | "forest" | "sunset";

export interface ZenithTheme {
  label: string;
  mode: "light" | "dark";
  background: string;
  backgroundGlow: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  editorBackground: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentWarm: string;
  selection: string;
  hover: string;
  terminalBackground: string;
  terminalForeground: string;
  terminalCursor: string;
  terminalSelection: string;
  statusBackground: string;
  success: string;
  danger: string;
}

export const themes: Record<ThemeName, ZenithTheme> = {
  light: {
    label: "Zenith Light", mode: "light", background: "#f8f7ff", backgroundGlow: "#f3e7ff", surface: "#ffffff", surfaceRaised: "#fffefe", surfaceMuted: "#f6f2ff", editorBackground: "#fffefe", text: "#27213f", textSecondary: "#5f5874", muted: "#948ba6", border: "#e9e2f4", borderStrong: "#dcd1ed", accent: "#8769df", accentHover: "#6f51c6", accentSoft: "#eee7ff", accentWarm: "#ef9bc7", selection: "#e4d8ff", hover: "#f3eeff", terminalBackground: "#1c1932", terminalForeground: "#eae5ff", terminalCursor: "#f6c0dc", terminalSelection: "#554777", statusBackground: "#f4f0fb", success: "#4f9b73", danger: "#cf5e7f",
  },
  dark: {
    label: "Zenith Dark", mode: "dark", background: "#141321", backgroundGlow: "#242043", surface: "#201e31", surfaceRaised: "#28253d", surfaceMuted: "#191727", editorBackground: "#1c1a2b", text: "#f1edff", textSecondary: "#c9c0dc", muted: "#978fac", border: "#38344e", borderStrong: "#504966", accent: "#b49aff", accentHover: "#d0bcff", accentSoft: "#393050", accentWarm: "#efa1cc", selection: "#4b3e70", hover: "#302c45", terminalBackground: "#12111d", terminalForeground: "#ebe7fb", terminalCursor: "#f5b9db", terminalSelection: "#51416f", statusBackground: "#1a1828", success: "#79c99b", danger: "#f08ca8",
  },
  aurora: {
    label: "Aurora", mode: "dark", background: "#111c27", backgroundGlow: "#153a48", surface: "#172734", surfaceRaised: "#1d3240", surfaceMuted: "#13212d", editorBackground: "#162631", text: "#e9fbf5", textSecondary: "#bbd6d0", muted: "#88aaa5", border: "#31505a", borderStrong: "#45706f", accent: "#78d7c3", accentHover: "#a1edda", accentSoft: "#26484c", accentWarm: "#efb0c8", selection: "#315e64", hover: "#213b45", terminalBackground: "#0d1820", terminalForeground: "#e5f7f2", terminalCursor: "#9cebd8", terminalSelection: "#2d535c", statusBackground: "#12212b", success: "#7bd2ab", danger: "#ec93ac",
  },
  sakura: {
    label: "Sakura", mode: "light", background: "#fff8fb", backgroundGlow: "#ffe7f3", surface: "#fffdfd", surfaceRaised: "#ffffff", surfaceMuted: "#fff2f8", editorBackground: "#fffdfd", text: "#412839", textSecondary: "#725568", muted: "#a98b9b", border: "#f1dce8", borderStrong: "#e8c6d8", accent: "#d96f9f", accentHover: "#bb5686", accentSoft: "#fbe0ec", accentWarm: "#e998b5", selection: "#f5cfdf", hover: "#ffedf5", terminalBackground: "#2c1728", terminalForeground: "#ffeaf4", terminalCursor: "#ffb8d2", terminalSelection: "#6c3b5b", statusBackground: "#fff0f7", success: "#5d9877", danger: "#cd527d",
  },
  midnight: {
    label: "Midnight", mode: "dark", background: "#101426", backgroundGlow: "#232a57", surface: "#181d35", surfaceRaised: "#222946", surfaceMuted: "#13182c", editorBackground: "#151a30", text: "#edf0ff", textSecondary: "#c2c8e7", muted: "#8d96bd", border: "#333b61", borderStrong: "#4a5684", accent: "#91a5ff", accentHover: "#bbc7ff", accentSoft: "#2e3966", accentWarm: "#eba3ce", selection: "#3d4c86", hover: "#273054", terminalBackground: "#0b0e1b", terminalForeground: "#e7eaff", terminalCursor: "#b9c7ff", terminalSelection: "#39466f", statusBackground: "#12162a", success: "#77c6a4", danger: "#f08fab",
  },
  forest: {
    label: "Forest", mode: "dark", background: "#13211d", backgroundGlow: "#1d4938", surface: "#1b2d27", surfaceRaised: "#243b32", surfaceMuted: "#162720", editorBackground: "#192a24", text: "#ecfaf0", textSecondary: "#c0d9ca", muted: "#8bab9b", border: "#365649", borderStrong: "#4b725f", accent: "#78c99a", accentHover: "#a4e5bb", accentSoft: "#294b3c", accentWarm: "#f0b58d", selection: "#3d6955", hover: "#294238", terminalBackground: "#0d1914", terminalForeground: "#e4f5ea", terminalCursor: "#9ce4b8", terminalSelection: "#315442", statusBackground: "#15261f", success: "#83d4a2", danger: "#ee9cad",
  },
  sunset: {
    label: "Sunset", mode: "light", background: "#fff8f2", backgroundGlow: "#ffe0c5", surface: "#fffdfb", surfaceRaised: "#ffffff", surfaceMuted: "#fff1e7", editorBackground: "#fffdfb", text: "#442c38", textSecondary: "#795969", muted: "#a88894", border: "#f1ddd8", borderStrong: "#e6c7bd", accent: "#dc756c", accentHover: "#bb5a5c", accentSoft: "#fee0d9", accentWarm: "#f0a46d", selection: "#f7d3c8", hover: "#ffebe2", terminalBackground: "#2b1824", terminalForeground: "#ffeced", terminalCursor: "#ffc2b1", terminalSelection: "#704052", statusBackground: "#fff0e8", success: "#579679", danger: "#cf5e75",
  },
};

export const themeEntries = Object.entries(themes) as [ThemeName, ZenithTheme][];

