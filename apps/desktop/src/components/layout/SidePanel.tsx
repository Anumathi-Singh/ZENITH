import Explorer from "../explorer/Explorer";
import { useLayoutStore } from "./layoutStore";
import AIPanel from "../ai/AIPanel";


export default function SidePanel() {
  const {
    activePanel,
  } = useLayoutStore();


  return (
    <aside
      className={`
        h-full
        rounded-3xl
        bg-white
        border
        border-purple-100
        overflow-hidden
        transition-all
        duration-300
        ease-in-out

        ${
          activePanel
            ? "w-full opacity-100 translate-x-0"
            : "w-0 opacity-0 -translate-x-5 border-0"
        }
      `}
    >

      <div
        className="
          w-[280px]
          h-full
        "
      >

        {activePanel === "explorer" && (
          <Explorer />
        )}


        {activePanel === "nova" && (
          <AIPanel />
        )}


        {activePanel === "search" && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              🔍 Search
            </h2>

            <p className="text-gray-500">
              Search across your project.
            </p>
          </div>
        )}


        {activePanel === "git" && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              🌱 Source Control
            </h2>

            <p className="text-gray-500">
              Git integration coming soon.
            </p>
          </div>
        )}


        {activePanel === "settings" && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              ⚙ Settings
            </h2>

            <p className="text-gray-500">
              Configure Zenith.
            </p>
          </div>
        )}

      </div>

    </aside>
  );
}