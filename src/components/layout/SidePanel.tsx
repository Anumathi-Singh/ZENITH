import AIPanel from "../ai/AIPanel";
import Explorer from "../explorer/Explorer";
import GitPanel from "../panels/GitPanel";
import SearchPanel from "../panels/SearchPanel";
import SettingsPanel from "../panels/SettingsPanel";
import { useLayoutStore } from "./layoutStore";

export default function SidePanel() {
  const { activePanel } = useLayoutStore();
  return <aside className={`side-panel-shell ${activePanel ? "is-open" : ""}`}><div className="side-panel-content">
    {activePanel === "explorer" && <Explorer />}
    {activePanel === "nova" && <AIPanel compact />}
    {activePanel === "search" && <SearchPanel />}
    {activePanel === "git" && <GitPanel />}
    {activePanel === "settings" && <SettingsPanel />}
  </div></aside>;
}
