import { Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.appearanceMode === "dark" || (theme.appearanceMode === "mixed" && theme.monaco.mode === "dark");
  const label = isDark ? "Switch to light preference" : "Switch to dark preference";

  return (
    <button onClick={toggleTheme} className="round-control" title={label} aria-label={label}>
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
