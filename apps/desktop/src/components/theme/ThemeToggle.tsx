import { Moon, Sun } from "lucide-react";
import { getQuickToggleTarget } from "./ThemeContext";
import { useTheme } from "./useTheme";

export default function ThemeToggle() {
  const { theme, toggleAppearance } = useTheme();
  const target = getQuickToggleTarget(theme);
  const label = `Switch to ${target} preference`;

  return (
    <button onClick={toggleAppearance} className="round-control" title={label} aria-label={label}>
      {target === "light" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
