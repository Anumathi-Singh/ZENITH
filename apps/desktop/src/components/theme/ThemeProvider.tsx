import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cssVariablesForTheme, fallbackThemeName, isThemeName, themeRegistry, type ThemeName } from "./themes";
import { getQuickToggleTarget, ThemeContext } from "./ThemeContext";
import { notify } from "../ui/uiStore";

interface Props { children: ReactNode; }
interface ThemePreferences {
  selectedThemeId: ThemeName;
  preferredLightThemeId: ThemeName;
  preferredDarkThemeId: ThemeName;
}

const preferencesStorageKey = "zenith-theme-preferences-v1";
const legacyStorageKeys = { selected: "zenith-theme", light: "zenith-light-theme", dark: "zenith-dark-theme" } as const;
const defaultPreferences: ThemePreferences = {
  selectedThemeId: fallbackThemeName,
  preferredLightThemeId: "light",
  preferredDarkThemeId: "dark",
};
const isAppearanceTheme = (value: unknown, appearance: "light" | "dark"): value is ThemeName =>
  typeof value === "string" && isThemeName(value) && themeRegistry[value].appearanceMode === appearance;

function readStoredPreferences(): ThemePreferences {
  try {
    const stored = localStorage.getItem(preferencesStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemePreferences>;
      return {
        selectedThemeId: isThemeName(parsed.selectedThemeId) ? parsed.selectedThemeId : defaultPreferences.selectedThemeId,
        preferredLightThemeId: isAppearanceTheme(parsed.preferredLightThemeId, "light") ? parsed.preferredLightThemeId : defaultPreferences.preferredLightThemeId,
        preferredDarkThemeId: isAppearanceTheme(parsed.preferredDarkThemeId, "dark") ? parsed.preferredDarkThemeId : defaultPreferences.preferredDarkThemeId,
      };
    }
    const legacySelected = localStorage.getItem(legacyStorageKeys.selected);
    const legacyLight = localStorage.getItem(legacyStorageKeys.light);
    const legacyDark = localStorage.getItem(legacyStorageKeys.dark);
    return {
      selectedThemeId: isThemeName(legacySelected) ? legacySelected : defaultPreferences.selectedThemeId,
      preferredLightThemeId: isAppearanceTheme(legacyLight, "light") ? legacyLight : defaultPreferences.preferredLightThemeId,
      preferredDarkThemeId: isAppearanceTheme(legacyDark, "dark") ? legacyDark : defaultPreferences.preferredDarkThemeId,
    };
  } catch {
    return defaultPreferences;
  }
}

export default function ThemeProvider({ children }: Props) {
  const [preferences, setPreferences] = useState<ThemePreferences>(readStoredPreferences);
  const { selectedThemeId, preferredLightThemeId, preferredDarkThemeId } = preferences;
  const theme = themeRegistry[selectedThemeId] ?? themeRegistry[fallbackThemeName];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.dataset.appearance = theme.appearanceMode;
    root.dataset.decorationStyle = theme.decoration.style;
    Object.entries(cssVariablesForTheme(theme)).forEach(([token, value]) => root.style.setProperty(token, value));
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences));
      Object.values(legacyStorageKeys).forEach((key) => localStorage.removeItem(key));
    } catch { /* persistence is optional */ }
  }, [preferences]);

  const setTheme = useCallback((name: ThemeName) => {
    const next = themeRegistry[name] ? name : fallbackThemeName;
    if (next === selectedThemeId) return;
    setPreferences((current) => ({ ...current, selectedThemeId: next }));
    notify(`${themeRegistry[next].label} applied.`, "success");
  }, [selectedThemeId]);
  const setPreferredLightTheme = useCallback((name: ThemeName) => {
    if (!isAppearanceTheme(name, "light") || name === preferredLightThemeId) return;
    setPreferences((current) => ({ ...current, preferredLightThemeId: name }));
    notify(`${themeRegistry[name].label} set as your light preference.`, "success");
  }, [preferredLightThemeId]);
  const setPreferredDarkTheme = useCallback((name: ThemeName) => {
    if (!isAppearanceTheme(name, "dark") || name === preferredDarkThemeId) return;
    setPreferences((current) => ({ ...current, preferredDarkThemeId: name }));
    notify(`${themeRegistry[name].label} set as your dark preference.`, "success");
  }, [preferredDarkThemeId]);
  const toggleAppearance = useCallback(() => {
    setTheme(getQuickToggleTarget(theme) === "dark" ? preferredDarkThemeId : preferredLightThemeId);
  }, [preferredDarkThemeId, preferredLightThemeId, setTheme, theme]);

  const value = useMemo(() => ({ selectedThemeId, theme, preferredLightThemeId, preferredDarkThemeId, toggleAppearance, setTheme, setPreferredLightTheme, setPreferredDarkTheme }), [preferredDarkThemeId, preferredLightThemeId, selectedThemeId, setPreferredDarkTheme, setPreferredLightTheme, setTheme, theme, toggleAppearance]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
