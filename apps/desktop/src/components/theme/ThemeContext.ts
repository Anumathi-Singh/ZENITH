import { createContext } from "react";
import { themes, type ThemeName } from "./themes";

export interface ThemeContextType {
  themeName: ThemeName;

  theme: (typeof themes)[ThemeName];

  toggleTheme: () => void;

  setTheme: (theme: ThemeName) => void;
}

export const ThemeContext =
  createContext<ThemeContextType | null>(null);