import { createContext } from "react";
import { fallbackThemeName, themeRegistry, type ThemeName, type ZenithTheme } from "./themes";

export interface ThemeContextType {
  themeName: ThemeName;
  appliedThemeName: ThemeName;
  previewThemeName: ThemeName | null;
  theme: ZenithTheme;
  lightThemeName: ThemeName;
  darkThemeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
  previewTheme: (theme: ThemeName) => void;
  clearPreview: () => void;
  setPreferredTheme: (mode: "light" | "dark", theme: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
export const fallbackTheme = themeRegistry[fallbackThemeName];
