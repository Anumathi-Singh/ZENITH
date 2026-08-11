import { useState } from "react";
import { Bot, Boxes, FileCode2, GitBranch, Search, Settings, Sparkles } from "lucide-react";
import { useLayoutStore, type PanelType } from "./layoutStore";

const items: { icon: typeof FileCode2; name: string; panel: Exclude<PanelType, null> }[] = [
  { icon: FileCode2, name: "Explorer", panel: "explorer" },
  { icon: Search, name: "Search", panel: "search" },
  { icon: GitBranch, name: "Source Control", panel: "git" },
  { icon: Sparkles, name: "Zenith AI", panel: "nova" },
  { icon: Bot, name: "Agents", panel: "nova" },
  { icon: Boxes, name: "Extensions", panel: "settings" },
];

export default function ActivityBar() {
  const { activePanel, togglePanel } = useLayoutStore();
  const [notice, setNotice] = useState("");
  const activate = (panel: Exclude<PanelType, null>) => {
    if (panel === "nova") { togglePanel("nova"); setNotice("Zenith AI toggled"); return; }
    togglePanel(panel);
  };
  return <aside className="activity-bar"><div className="activity-main">{items.map(({ icon: Icon, name, panel }) => <button key={name} title={name} aria-label={name} onClick={() => activate(panel)} className={`activity-button ${activePanel === panel && panel !== "nova" ? "active" : ""}`}><Icon size={21} /></button>)}</div><div className="activity-bottom"><button className="activity-button" title="Settings" onClick={() => togglePanel("settings")}><Settings size={21} /></button><div className="avatar">A</div>{notice && <span className="sr-only">{notice}</span>}</div></aside>;
}
