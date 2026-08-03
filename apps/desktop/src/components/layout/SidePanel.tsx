import Explorer from "../explorer/Explorer";
import { useLayoutStore } from "./layoutStore";
import AIPanel from "../ai/AIPanel";

export default function SidePanel() {
  const { activePanel } = useLayoutStore();

  if (activePanel === null) {
    return null;
  }

  return (
    <aside
      className="
        rounded-3xl
        bg-white
        border
        border-purple-100
        overflow-hidden
      "
    >
      {activePanel === "explorer" && <Explorer />}

      {activePanel === "nova" && <AIPanel />}
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
    </aside>
  );
}