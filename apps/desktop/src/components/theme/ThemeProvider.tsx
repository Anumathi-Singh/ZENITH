import { useEffect, useMemo, useState, type ReactNode } from "react";
import { themes, type ThemeName } from "./themes";
import { ThemeContext } from "./ThemeContext";

interface Props { children: ReactNode; }

export default function ThemeProvider({ children }: Props) {
  const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem("zenith-theme") as ThemeName) ?? "light");
  useEffect(() => { document.documentElement.dataset.theme = themeName; localStorage.setItem("zenith-theme", themeName); }, [themeName]);
  const value = useMemo(() => ({ themeName, theme: themes[themeName], toggleTheme: () => setThemeName((current) => current === "light" ? "dark" : "light"), setTheme: setThemeName }), [themeName]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
