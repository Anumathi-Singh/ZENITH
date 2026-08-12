import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cssVariablesForTheme, fallbackThemeName, isThemeName, themeRegistry, type ThemeName } from "./themes";
import { ThemeContext } from "./ThemeContext";
import { notify } from "../ui/uiStore";

interface Props { children: ReactNode; }
const themeStorageKey = "zenith-theme";
const lightStorageKey = "zenith-light-theme";
const darkStorageKey = "zenith-dark-theme";
const readTheme = (key: string, fallback: ThemeName): ThemeName => {
  try { const value = localStorage.getItem(key); return isThemeName(value) ? value : fallback; }
  catch { return fallback; }
};

export default function ThemeProvider({ children }: Props) {
  const [appliedThemeName, setAppliedThemeName] = useState<ThemeName>(() => readTheme(themeStorageKey, fallbackThemeName));
  const [previewThemeName, setPreviewThemeName] = useState<ThemeName | null>(null);
  const [lightThemeName, setLightThemeName] = useState<ThemeName>(() => readTheme(lightStorageKey, "light"));
  const [darkThemeName, setDarkThemeName] = useState<ThemeName>(() => readTheme(darkStorageKey, "dark"));
  const themeName = previewThemeName ?? appliedThemeName;
  const theme = themeRegistry[themeName] ?? themeRegistry[fallbackThemeName];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.appearance = theme.appearanceMode;
    root.dataset.decorationStyle = theme.decoration.style;
    Object.entries(cssVariablesForTheme(theme)).forEach(([token, value]) => root.style.setProperty(token, value));
  }, [theme]);

  const setTheme = useCallback((name: ThemeName) => {
    const next = themeRegistry[name] ? name : fallbackThemeName;
    setAppliedThemeName(next); setPreviewThemeName(null);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* persistence is optional */ }
    notify(`${themeRegistry[next].label} applied.`, "success");
  }, []);
  const previewTheme = useCallback((name: ThemeName) => { if (themeRegistry[name]) setPreviewThemeName(name); }, []);
  const clearPreview = useCallback(() => setPreviewThemeName(null), []);
  const setPreferredTheme = useCallback((mode: "light" | "dark", name: ThemeName) => {
    if (!themeRegistry[name]) return;
    if (mode === "light") { setLightThemeName(name); try { localStorage.setItem(lightStorageKey, name); } catch { /* optional */ } }
    else { setDarkThemeName(name); try { localStorage.setItem(darkStorageKey, name); } catch { /* optional */ } }
    notify(`${themeRegistry[name].label} set as your ${mode} preference.`, "success");
  }, []);
  const toggleTheme = useCallback(() => {
    const active = themeRegistry[previewThemeName ?? appliedThemeName] ?? themeRegistry[fallbackThemeName];
    setTheme(active.appearanceMode === "light" || (active.appearanceMode === "mixed" && active.monaco.mode === "light") ? darkThemeName : lightThemeName);
  }, [appliedThemeName, darkThemeName, lightThemeName, previewThemeName, setTheme]);

  const value = useMemo(() => ({ themeName, appliedThemeName, previewThemeName, theme, lightThemeName, darkThemeName, toggleTheme, setTheme, previewTheme, clearPreview, setPreferredTheme }), [appliedThemeName, clearPreview, darkThemeName, lightThemeName, previewTheme, previewThemeName, setPreferredTheme, setTheme, theme, themeName, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
