import { createContext } from "react";
import { fallbackThemeName, themeRegistry, type ThemeName, type ZenithTheme } from "./themes";

export interface ThemeContextType {
  selectedThemeId: ThemeName;
  theme: ZenithTheme;
  preferredLightThemeId: ThemeName;
  preferredDarkThemeId: ThemeName;
  toggleAppearance: () => void;
  setTheme: (theme: ThemeName) => void;
  setPreferredLightTheme: (theme: ThemeName) => void;
  setPreferredDarkTheme: (theme: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
export const fallbackTheme = themeRegistry[fallbackThemeName];

export function getQuickToggleTarget(theme: ZenithTheme): "light" | "dark" {
  if (theme.appearanceMode === "light") return "dark";
  if (theme.appearanceMode === "dark") return "light";
  return theme.preferredQuickToggleTarget ?? (theme.monaco.mode === "dark" ? "light" : "dark");
}
