import { Bot, FileCode2, GitBranch, Puzzle, Search, Settings, Sparkles } from "lucide-react";
import { useLayoutStore, type PanelType } from "./layoutStore";
import { useUiStore } from "../ui/uiStore";

const panelItems: { icon: typeof FileCode2; name: string; panel: Exclude<PanelType, null> }[] = [
  { icon: FileCode2, name: "Explorer", panel: "explorer" },
  { icon: Search, name: "Search", panel: "search" },
  { icon: GitBranch, name: "Source Control", panel: "git" },
  { icon: Puzzle, name: "Extensions", panel: "extensions" },
];

export default function ActivityBar() {
  const { activePanel, togglePanel, aiPanelOpen, toggleAIPanel } = useLayoutStore();
  const { openSettings, openDialog } = useUiStore();
  return <aside className="activity-bar" aria-label="Workspace tools"><div className="activity-main">{panelItems.map(({ icon: Icon, name, panel }) => <button key={name} title={name} aria-label={name} aria-pressed={activePanel === panel} onClick={() => togglePanel(panel)} className={`activity-button ${activePanel === panel ? "active" : ""}`}><Icon size={20} /></button>)}<span className="activity-divider" /><button title="Toggle Zenith AI" aria-label="Toggle Zenith AI" aria-pressed={aiPanelOpen} onClick={toggleAIPanel} className={`activity-button activity-ai ${aiPanelOpen ? "active" : ""}`}><Sparkles size={20} /></button></div><div className="activity-bottom"><button className="activity-button" title="Settings" aria-label="Settings" onClick={() => openSettings()}><Settings size={20} /></button><button className="activity-avatar" title="Zenith profile" aria-label="Zenith profile" onClick={() => openDialog("auth", "signin")}><Bot size={15} /></button></div></aside>;
}
