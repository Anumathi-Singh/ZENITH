import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { themes, type ThemeName } from "./themes";
import { ThemeContext } from "./ThemeContext";

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({
  children,
}: Props) {
  const [themeName, setThemeName] =
    useState<ThemeName>("light");

  const toggleTheme = () => {
    setThemeName((prev) =>
      prev === "light"
        ? "dark"
        : "light"
    );
  };

  const value = useMemo(
    () => ({
      themeName,
      theme: themes[themeName],
      toggleTheme,
      setTheme: setThemeName,
    }),
    [themeName]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}