import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronRight, CircleHelp, Cloud, Command, FolderOpen, GitBranch, Minimize2, Moon, Search, Settings, Sparkles, Sun, UserRound, X } from "lucide-react";
import zenithMark from "../../assets/logo/zenith-mark-transparent.png";
import { useDismissableLayer } from "../ui/useDismissableLayer";
import { useTheme } from "../theme/useTheme";
import { getQuickToggleTarget } from "../theme/ThemeContext";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useLayoutStore } from "./layoutStore";
import { notify, useUiStore } from "../ui/uiStore";
import { useEditorStore } from "../editor/editorStore";
import { useGitStore } from "../panels/gitStore";
import { useAuthStore } from "../auth/authStore";

type MenuItem = { label: string; hint?: string; action?: () => void; disabled?: boolean; separator?: boolean };
interface TopBarProps { onToggleTerminal: () => void; terminalCollapsed: boolean; }

function AppMenu({ label, items, open, onToggle, onClose }: { label: string; items: MenuItem[]; open: boolean; onToggle: () => void; onClose: () => void }) {
  const ref = useDismissableLayer<HTMLDivElement>(open, onClose);
  return <div className="app-menu-anchor" ref={ref}><button className={`app-menu-trigger ${open ? "open" : ""}`} onClick={onToggle} aria-expanded={open}>{label}</button>{open && <div className="zenith-popover app-menu" role="menu">{items.map((item, index) => item.separator ? <hr key={`${item.label}-${index}`} /> : <button key={item.label} role="menuitem" disabled={item.disabled} onClick={() => { item.action?.(); onClose(); }}><span>{item.label}</span>{item.hint && <kbd>{item.hint}</kbd>}</button>)}</div>}</div>;
}

function AccountPopover({ onClose }: { onClose: () => void }) {
  const { session, loading, signOut } = useAuthStore();
  const { openDialog, openSettings } = useUiStore();
  const user = session?.user;
  return <div className="zenith-popover account-menu">
    <header>{user?.avatarUrl ? <img className="account-avatar account-avatar-image" src={user.avatarUrl} alt="" /> : <span className="account-avatar"><UserRound size={16} /></span>}<div><strong>{user?.name || (user ? `@${user.login}` : "Not signed in")}</strong><small>{user ? `GitHub · @${user.login}` : "Local desktop workspace"}</small></div></header>
    {user ? <><button onClick={() => { openSettings("GitHub & Accounts"); onClose(); }}>Connected Services</button><button onClick={() => { openDialog("github"); onClose(); }}>Manage Account</button><button disabled={loading} onClick={() => { void signOut("github"); onClose(); }}>Sign Out GitHub</button></> : <><button onClick={() => { openDialog("auth", "signin"); onClose(); }}>Sign in</button><button onClick={() => { openDialog("auth", "signup"); onClose(); }}>Create Zenith Account</button><button onClick={onClose}>Continue Offline</button><button onClick={() => { openSettings("GitHub & Accounts"); onClose(); }}>Settings</button></>}
  </div>;
}

export default function TopBar({ onToggleTerminal, terminalCollapsed }: TopBarProps) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState(""); const [selectedCommand, setSelectedCommand] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleAppearance } = useTheme();
  const quickToggleTarget = getQuickToggleTarget(theme);
  const { rootName, rootPath, openFolder, closeFolder } = useWorkspaceStore();
  const { togglePanel, toggleAIPanel } = useLayoutStore();
  const { openCommandPalette, closeCommandPalette, commandPaletteOpen, openSettings, openDialog, notifications, markNotificationsRead, clearNotifications } = useUiStore();
  const { activeTab, tabs, saveTab } = useEditorStore();
  const gitStatus = useGitStore((state) => state.status);
  const projectMenuRef = useDismissableLayer<HTMLDivElement>(projectMenuOpen, () => setProjectMenuOpen(false));
  const accountRef = useDismissableLayer<HTMLDivElement>(accountOpen, () => setAccountOpen(false));
  const notificationRef = useDismissableLayer<HTMLDivElement>(notificationOpen, () => setNotificationOpen(false));

  useEffect(() => { if (commandPaletteOpen) window.setTimeout(() => inputRef.current?.focus(), 0); }, [commandPaletteOpen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && (event.key.toLowerCase() === "k" || event.key.toLowerCase() === "p")) { event.preventDefault(); openCommandPalette(); }
      if (modifier && event.key === ",") { event.preventDefault(); openSettings(); }
      if (modifier && event.shiftKey && event.key.toLowerCase() === "e") { event.preventDefault(); togglePanel("explorer"); }
      if (modifier && event.key === "`") { event.preventDefault(); onToggleTerminal(); }
    };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleTerminal, openCommandPalette, openSettings, togglePanel]);

  const saveCurrent = useCallback(() => { if (activeTab) void saveTab(activeTab); else notify("No file is open to save.", "info"); }, [activeTab, saveTab]);
  const commandActions = useMemo(() => [
    { label: "Open Folder", hint: "File", action: () => void openFolder() },
    { label: "Close Folder", hint: "File", action: () => void closeFolder(), disabled: !rootPath },
    { label: "Save Active File", hint: "Ctrl S", action: saveCurrent, disabled: !activeTab },
    { label: "Toggle Explorer", hint: "Ctrl Shift E", action: () => togglePanel("explorer") },
    { label: "Toggle Search", hint: "View", action: () => togglePanel("search") },
    { label: "Toggle Source Control", hint: "View", action: () => togglePanel("git") },
    { label: "Open Extensions", hint: "View", action: () => togglePanel("extensions") },
    { label: "Toggle Zenith AI", hint: "View", action: toggleAIPanel },
    { label: terminalCollapsed ? "Show Terminal" : "Collapse Terminal", hint: "Ctrl `", action: onToggleTerminal },
    { label: "Open Settings", hint: "Ctrl ,", action: () => openSettings() },
    { label: "Keyboard Shortcuts", hint: "Help", action: () => openDialog("shortcuts") },
    { label: "Connect GitHub", hint: "Accounts", action: () => openDialog("github") },
  ], [activeTab, closeFolder, onToggleTerminal, openDialog, openFolder, openSettings, rootPath, saveCurrent, terminalCollapsed, toggleAIPanel, togglePanel]);
  const matches = commandActions.filter((command) => command.label.toLowerCase().includes(query.trim().toLowerCase()));
  const runCommand = (index: number) => { const command = matches[index]; if (command && !command.disabled) command.action(); closeCommandPalette(); setQuery(""); setSelectedCommand(0); };
  const keyCommands = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === "ArrowDown") { event.preventDefault(); setSelectedCommand((value) => Math.min(value + 1, Math.max(matches.length - 1, 0))); } else if (event.key === "ArrowUp") { event.preventDefault(); setSelectedCommand((value) => Math.max(value - 1, 0)); } else if (event.key === "Enter") { event.preventDefault(); runCommand(selectedCommand); } else if (event.key === "Escape") closeCommandPalette(); };

  const menus: Record<string, MenuItem[]> = {
    File: [{ label: "Open Folder…", hint: "Ctrl O", action: () => void openFolder() }, { label: "Close Folder", action: () => void closeFolder(), disabled: !rootPath }, { label: "Save", hint: "Ctrl S", action: saveCurrent, disabled: !activeTab }, { label: "Save All", action: () => void Promise.all(tabs.filter((tab) => tab.isDirty).map((tab) => saveTab(tab.id))), disabled: !tabs.some((tab) => tab.isDirty) }, { label: "sep", separator: true }, { label: "Open Recent", disabled: true }],
    Edit: [{ label: "Undo", hint: "Ctrl Z", disabled: true }, { label: "Redo", hint: "Ctrl Y", disabled: true }, { label: "sep", separator: true }, { label: "Cut", hint: "Ctrl X", disabled: true }, { label: "Copy", hint: "Ctrl C", disabled: true }, { label: "Paste", hint: "Ctrl V", disabled: true }],
    Selection: [{ label: "Select All", hint: "Ctrl A", disabled: true }, { label: "Expand Selection", disabled: true }, { label: "Shrink Selection", disabled: true }],
    View: [{ label: "Explorer", action: () => togglePanel("explorer") }, { label: "Search", action: () => togglePanel("search") }, { label: "Source Control", action: () => togglePanel("git") }, { label: "Extensions", action: () => togglePanel("extensions") }, { label: "Zenith AI", action: toggleAIPanel }, { label: "sep", separator: true }, { label: "Terminal", hint: "Ctrl `", action: onToggleTerminal }, { label: "Settings", hint: "Ctrl ,", action: () => openSettings() }],
    Go: [{ label: "Go to File", hint: "Ctrl P", action: openCommandPalette }, { label: "Go to Settings", action: () => openSettings() }, { label: "Go to Source Control", action: () => togglePanel("git") }],
    Run: [{ label: "Run Without Debugging", disabled: true }, { label: "Start Debugging", disabled: true }, { label: "Add Configuration…", disabled: true }],
    Terminal: [{ label: terminalCollapsed ? "Show Terminal" : "Hide Terminal", hint: "Ctrl `", action: onToggleTerminal }, { label: "New Terminal", action: () => window.dispatchEvent(new Event("zenith:terminal-new")) }, { label: "Clear Active Terminal", action: () => window.dispatchEvent(new Event("zenith:terminal-clear")) }, { label: "Kill Active Terminal", action: () => window.dispatchEvent(new Event("zenith:terminal-kill-active")) }],
    Help: [{ label: "Keyboard Shortcuts", action: () => openDialog("shortcuts") }, { label: "Zenith Help", action: () => openDialog("help") }, { label: "About Zenith", action: () => openDialog("about") }],
  };
  const unread = notifications.filter((item) => !item.read).length;

  const branchLabel = gitStatus?.branch.detached ? "Detached HEAD" : gitStatus?.branch.name ?? "Source Control";
  return <header className="topbar"><div className="topbar-left"><div className="brand-lockup"><img src={zenithMark} alt="Zenith" /><strong>Zenith</strong></div><div className="app-menu-row" aria-label="Application menu">{Object.keys(menus).map((name) => <AppMenu key={name} label={name} items={menus[name]} open={activeMenu === name} onToggle={() => setActiveMenu((current) => current === name ? null : name)} onClose={() => setActiveMenu(null)} />)}</div><span className="topbar-divider" /><div className="topbar-menu-anchor" ref={projectMenuRef}><button className="project-switcher" onClick={() => setProjectMenuOpen((value) => !value)} aria-expanded={projectMenuOpen}><FolderOpen size={16} /><span>{rootName}</span><span className="chevron">⌄</span></button>{projectMenuOpen && <div className="zenith-popover project-menu" role="menu"><button role="menuitem" onClick={() => { void openFolder(); setProjectMenuOpen(false); }}><FolderOpen size={15} />Open Folder</button><button role="menuitem" onClick={() => { void closeFolder(); setProjectMenuOpen(false); }} disabled={!rootPath}><X size={15} />Close Folder</button></div>}</div><button className="branch-switcher" title="Open Source Control" onClick={() => togglePanel("git")}><GitBranch size={15} /><span>{branchLabel}</span></button></div>
    <button className="command-search" onClick={openCommandPalette} aria-haspopup="dialog" aria-expanded={commandPaletteOpen}><Search size={16} /><span>Search anything…</span><kbd><Command size={11} /> K</kbd></button>
    <div className="topbar-actions"><Cloud className="topbar-cloud" size={19} aria-label="Workspace available offline" /><button className="ai-toggle" onClick={toggleAIPanel} title="Toggle Zenith AI"><Sparkles size={15} /><span>AI</span></button><button className="top-icon" title={`Switch to ${quickToggleTarget} preference`} aria-label={`Switch to ${quickToggleTarget} preference`} onClick={toggleAppearance}>{quickToggleTarget === "light" ? <Sun size={17} /> : <Moon size={17} />}</button><div ref={notificationRef}><button className="top-icon notification-button" title="Notifications" aria-label="Notifications" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((value) => !value); markNotificationsRead(); }}><Bell size={17} />{unread > 0 && <i>{unread > 9 ? "9+" : unread}</i>}</button>{notificationOpen && <div className="zenith-popover notification-menu"><header><strong>Notifications</strong><button onClick={clearNotifications} disabled={!notifications.length}><CheckCheck size={14} />Clear</button></header>{notifications.length ? notifications.slice(0, 6).map((item) => <p key={item.id}>{item.message}</p>) : <p className="empty-notifications">You’re all caught up.</p>}</div>}</div><button className="top-icon" title="Help" aria-label="Help" onClick={() => openDialog("help")}><CircleHelp size={17} /></button><button className="top-icon" title="Settings" aria-label="Settings" onClick={() => openSettings()}><Settings size={17} /></button><div ref={accountRef}><button className="account-button" title="Account" aria-label="Account" onClick={() => setAccountOpen((value) => !value)}><UserRound size={16} /></button>{accountOpen && <AccountPopover onClose={() => setAccountOpen(false)} />}</div>{window.zenithDesktop && <div className="window-controls" aria-label="Window controls"><button title="Minimize window" onClick={() => void window.zenithDesktop?.minimizeWindow()}><Minimize2 size={16} /></button><button title="Maximize or restore window" onClick={() => void window.zenithDesktop?.toggleMaximizeWindow()}>□</button><button title="Close window" onClick={() => void window.zenithDesktop?.closeWindow()}><X size={16} /></button></div>}</div>
    {commandPaletteOpen && <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCommandPalette(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Zenith command center"><div className="command-input"><Search size={18} /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCommand(0); }} onKeyDown={keyCommands} placeholder="Search commands" /></div><div className="command-results">{matches.map((command, index) => <button key={command.label} className={selectedCommand === index ? "selected" : ""} disabled={command.disabled} onMouseEnter={() => setSelectedCommand(index)} onClick={() => runCommand(index)}><span>{command.label}</span><small>{command.hint}</small></button>)}{!matches.length && <p>No Zenith command matches that search.</p>}</div><footer><span><ChevronRight size={13} />to run</span><span>↑ ↓ to navigate</span><span>Esc to close</span></footer></section></div>}
  </header>;
}







