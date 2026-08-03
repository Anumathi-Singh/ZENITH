import {
  FolderOpen,
  Bot,
  Search,
  GitBranch,
  Settings,
} from "lucide-react";

import { useLayoutStore } from "./layoutStore";

const items = [
  {
    icon: FolderOpen,
    name: "Explorer",
    panel: "explorer",
  },
  {
    icon: Bot,
    name: "Nova",
    panel: "nova",
  },
  {
    icon: Search,
    name: "Search",
    panel: "search",
  },
  {
    icon: GitBranch,
    name: "Git",
    panel: "git",
  },
  {
    icon: Settings,
    name: "Settings",
    panel: "settings",
  },
] as const;

export default function ActivityBar() {

  const {
    activePanel,
    togglePanel,
  } = useLayoutStore();

  return (
    <aside
      className="
        h-full
        w-16
        rounded-3xl
        bg-white/70
        backdrop-blur-xl
        border
        border-purple-100
        shadow-[0_10px_30px_rgba(120,90,180,0.08)]
        flex
        flex-col
        items-center
        py-4
        gap-3
      "
    >
      {items.map((item) => {

        const Icon = item.icon;

        const active =
          activePanel === item.panel;

        return (
          <button
            key={item.name}
            title={item.name}
            onClick={() =>
              togglePanel(item.panel)
            }
            className={`
              w-10
              h-10
              rounded-2xl
              flex
              items-center
              justify-center
              transition-all

              ${
                active
                  ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                  : "text-gray-500 hover:bg-purple-50 hover:text-violet-600"
              }
            `}
          >
            <Icon size={20} />
          </button>
        );

      })}
    </aside>
  );
}