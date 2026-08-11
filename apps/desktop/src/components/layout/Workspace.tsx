import { useEffect, useRef } from "react";
import AIPanel from "../ai/AIPanel";
import Editor from "../editor/Editor";
import ActivityBar from "./ActivityBar";
import SidePanel from "./SidePanel";
import { useLayoutStore } from "./layoutStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";

export default function Workspace() {
  const { activePanel, isAiPanelOpen, setAiPanelOpen } = useLayoutStore();
  const loadFiles = useWorkspaceStore((state) => state.loadFiles);
  const folderInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (folderInput.current) { folderInput.current.setAttribute("webkitdirectory", ""); folderInput.current.setAttribute("directory", ""); } const openInput = () => folderInput.current?.click(); window.addEventListener("zenith-open-folder-input", openInput); return () => window.removeEventListener("zenith-open-folder-input", openInput); }, []);
  return <main className={`workspace-grid ${activePanel ? "with-panel" : "without-panel"} ${isAiPanelOpen ? "with-ai" : "without-ai"}`}><input ref={folderInput} className="folder-input" type="file" multiple onChange={(event) => { if (event.target.files) void loadFiles(event.target.files); event.currentTarget.value = ""; }} /><ActivityBar /><SidePanel /><Editor />{isAiPanelOpen && <AIPanel onClose={() => setAiPanelOpen(false)} />}</main>;
}
