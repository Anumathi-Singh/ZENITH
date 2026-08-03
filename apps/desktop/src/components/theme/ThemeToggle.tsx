import { Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";

export default function ThemeToggle() {
  const {
    themeName,
    toggleTheme,
  } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        flex
        items-center
        gap-2
        rounded-full
        border
        border-purple-200
        bg-white
        px-3
        py-2
        transition
        hover:bg-purple-50
      "
    >
      {themeName === "light" ? (
        <>
          <Moon size={16} />
          <span className="text-sm">
            Dark
          </span>
        </>
      ) : (
        <>
          <Sun size={16} />
          <span className="text-sm">
            Light
          </span>
        </>
      )}
    </button>
  );
}