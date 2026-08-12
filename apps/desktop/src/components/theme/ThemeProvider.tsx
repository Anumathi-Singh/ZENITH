import { useEffect, useMemo, useState, type ReactNode } from "react";
import { themes, type ThemeName } from "./themes";
import { ThemeContext } from "./ThemeContext";
import { notify } from "../ui/uiStore";

interface Props { children: ReactNode; }
const storageKey = "zenith-theme";
const isThemeName = (value: string | null): value is ThemeName => Boolean(value && value in themes);

export default function ThemeProvider({ children }: Props) {
  const [themeName, setThemeName] = useState<ThemeName>(() => { const saved = localStorage.getItem(storageKey); return isThemeName(saved) ? saved : "light"; });
  useEffect(() => { const theme = themes[themeName]; const root = document.documentElement; root.dataset.theme = themeName; Object.entries({ "--z-app": theme.background, "--z-glow": theme.backgroundGlow, "--z-surface": theme.surface, "--z-surface-raised": theme.surfaceRaised, "--z-surface-muted": theme.surfaceMuted, "--z-editor": theme.editorBackground, "--z-text": theme.text, "--z-text-secondary": theme.textSecondary, "--z-muted": theme.muted, "--z-border": theme.border, "--z-border-strong": theme.borderStrong, "--z-accent": theme.accent, "--z-accent-hover": theme.accentHover, "--z-accent-soft": theme.accentSoft, "--z-accent-warm": theme.accentWarm, "--z-selection": theme.selection, "--z-hover": theme.hover, "--z-terminal": theme.terminalBackground, "--z-terminal-text": theme.terminalForeground, "--z-status": theme.statusBackground, "--z-success": theme.success, "--z-danger": theme.danger }).forEach(([token, value]) => root.style.setProperty(token, value)); localStorage.setItem(storageKey, themeName); }, [themeName]);
  const chooseTheme = (name: ThemeName) => setThemeName((current) => { if (current !== name) notify(`${themes[name].label} applied.`, "success"); return name; });
  const value = useMemo(() => ({ themeName, theme: themes[themeName], toggleTheme: () => chooseTheme(themeName === "dark" ? "light" : "dark"), setTheme: chooseTheme }), [themeName]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

