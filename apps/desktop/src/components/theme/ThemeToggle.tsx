import { Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";

export default function ThemeToggle() {
  const { themeName, toggleTheme } = useTheme();
  const label = themeName === "light" ? "Switch to midnight mode" : "Switch to light mode";

  return (
    <button onClick={toggleTheme} className="round-control" title={label} aria-label={label}>
      {themeName === "light" ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
