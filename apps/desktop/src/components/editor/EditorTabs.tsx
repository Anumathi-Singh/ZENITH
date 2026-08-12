import { useEffect, useRef, useState } from "react";
import { Check, ChevronsRight, Copy, FileText, FolderOpen, MoreHorizontal, X } from "lucide-react";
import { useEditorStore } from "./editorStore";
import { useAppPreferences } from "../settings/appPreferences";
import { notify } from "../ui/uiStore";

export default function EditorTabs() {
  const { tabs, activeTab, setActiveTab, closeTab, saveTab } = useEditorStore();
  const confirmClose = useAppPreferences((state) => state.confirmBeforeClosingDirtyFiles);
  const [menuTab, setMenuTab] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuTab(null); }; window.addEventListener("pointerdown", close); return () => window.removeEventListener("pointerdown", close); }, []);
  const requestClose = (id: string) => {
    const tab = tabs.find((item) => item.id === id);
    if (tab?.isDirty && confirmClose && !window.confirm(`Close ${tab.name}? Your unsaved changes will remain only in this session.`)) return;
    closeTab(id);
  };
  const copyPath = async (path?: string) => { if (!path) return notify("This tab is not backed by a workspace file.", "warning"); try { if (window.zenithDesktop?.copyText) await window.zenithDesktop.copyText(path); else await navigator.clipboard.writeText(path); notify("File path copied.", "success"); } catch { notify("Could not copy the file path.", "error"); } };
  if (!tabs.length) return <div className="editor-tabs empty-tabs"><span>No file open</span></div>;
  return <div className="editor-tabs"><div className="editor-tabs-scroll">{tabs.map((tab) => <div key={tab.id} className={`editor-tab ${activeTab === tab.id ? "is-active" : ""}`}><button className="editor-tab-label" title={tab.path ?? tab.name} onClick={() => setActiveTab(tab.id)}><FileText size={14} /><span>{tab.name}</span>{tab.isDirty && <i className="dirty-indicator" />}</button><button className="editor-tab-more" title="Tab actions" onClick={() => setMenuTab(menuTab === tab.id ? null : tab.id)}><MoreHorizontal size={15} /></button><button className="editor-tab-close" title={`Close ${tab.name}`} onClick={() => requestClose(tab.id)}><X size={14} /></button>{menuTab === tab.id && <div ref={menuRef} className="editor-tab-menu zenith-popover"><button onClick={() => { void saveTab(tab.id); setMenuTab(null); }}><Check size={14} />Save</button><button onClick={() => { void copyPath(tab.path); setMenuTab(null); }}><Copy size={14} />Copy Path</button><button disabled={!tab.path || !window.zenithDesktop?.revealPath} onClick={() => { void window.zenithDesktop?.revealPath?.(tab.path!); setMenuTab(null); }}><FolderOpen size={14} />Reveal in Explorer</button><button onClick={() => { tabs.filter((item) => item.id !== tab.id).forEach((item) => closeTab(item.id)); setMenuTab(null); }}><ChevronsRight size={14} />Close Others</button></div>}</div>)}</div></div>;
}

