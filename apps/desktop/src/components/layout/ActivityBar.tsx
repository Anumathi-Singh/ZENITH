import { useLayoutStore } from "./layoutStore";

type Panel =
  | "explorer"
  | "search"
  | "nova"
  | "git"
  | "settings"
  | null;

const items: {
  icon: string;
  name: string;
  panel: Panel;
}[] = [
  {
    icon: "⌂",
    name: "Home",
    panel: null,
  },
  {
    icon: "▢",
    name: "Explorer",
    panel: "explorer",
  },
  {
    icon: "⌕",
    name: "Search",
    panel: "search",
  },
  {
    icon: "✦",
    name: "Nova",
    panel: "nova",
  },
  {
    icon: "⑂",
    name: "Git",
    panel: "git",
  },
  {
    icon: "⚙",
    name: "Settings",
    panel: "settings",
  },
];

export default function ActivityBar() {
  const {
    activePanel,
    setActivePanel,
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
        gap-4
      "
    >
      {items.map((item) => (
        <button
          key={item.name}
          title={item.name}
          onClick={() => {
            if (!item.panel) return;

            setActivePanel(
              activePanel === item.panel
                ? null
                : item.panel
            );
          }}
          className={`
            w-10
            h-10
            rounded-2xl
            flex
            items-center
            justify-center
            text-lg
            transition-all

            ${
              activePanel === item.panel
                ? "bg-gradient-to-br from-purple-300 to-pink-300 text-white shadow-md"
                : "text-gray-400 hover:bg-purple-50 hover:text-purple-500"
            }
          `}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
}