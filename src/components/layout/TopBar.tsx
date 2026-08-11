import { useState } from "react";
import { Bell, ChevronDown, CircleHelp, Cloud, Command, GitBranch, Minus, Moon, PanelTop, Search, Settings, Sparkles, Sun, X } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useLayoutStore } from "./layoutStore";

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { themeName, setTheme } = useTheme();
  const { rootName, openFolder } = useWorkspaceStore();
  const { toggleAiPanel, togglePanel } = useLayoutStore();
  return <header className="topbar"><div className="topbar-brand"><div className="brand-mark"><Sparkles size={20} /></div><strong>Zenith</strong><span className="topbar-divider" /><button className="project-switcher" onClick={() => void openFolder()}><PanelTop size={17} /><span>{rootName}</span><ChevronDown size={14} /></button><button className="branch-switcher" onClick={() => togglePanel("git")}><GitBranch size={16} /><span>main</span><ChevronDown size={14} /></button></div><button className="command-search" onClick={() => { setSearchOpen(true); togglePanel("search"); }}><Search size={17} /><span>Search anything...</span><kbd><Command size={12} /> K</kbd></button><div className="topbar-actions"><div className="topbar-cloud"><Cloud size={22} /></div><div className="mascot-dot">⌁</div><button className="ai-toggle" onClick={toggleAiPanel}><Sparkles size={16} /> AI</button><div className="theme-switch" aria-label="Theme"><button className={themeName === "light" ? "active" : ""} onClick={() => setTheme("light")} title="Light mode"><Sun size={16} /></button><button className={themeName === "dark" ? "active" : ""} onClick={() => setTheme("dark")} title="Midnight mode"><Moon size={16} /></button></div><button className="top-icon" title="Notifications"><Bell size={18} /></button><button className="top-icon" title="Help"><CircleHelp size={18} /></button><button className="top-icon" title="Settings" onClick={() => togglePanel("settings")}><Settings size={18} /></button><span className="window-controls"><Minus size={16} /><span>□</span><X size={18} /></span></div>{searchOpen && <div className="command-palette"><Search size={18} /><input autoFocus placeholder="Search files and commands" onBlur={() => setSearchOpen(false)} /></div>}</header>;
}
