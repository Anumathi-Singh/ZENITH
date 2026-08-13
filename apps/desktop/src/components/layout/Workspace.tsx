import { useEffect, useRef } from "react";
import ActivityBar from "./ActivityBar";
import SidePanel from "./SidePanel";
import Editor from "../editor/Editor";
import AIPanel from "../ai/AIPanel";
import { useLayoutStore } from "./layoutStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useGitStore } from "../panels/gitStore";

const AI_AUTO_COLLAPSE_WIDTH = 1180;

export default function Workspace() {
  const { activePanel, aiPanelOpen, setAIPanelOpen } = useLayoutStore();
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const refreshGit = useGitStore((state) => state.refresh);
  const clearGit = useGitStore((state) => state.clear);
  const autoCollapsedAi = useRef(false);

  useEffect(() => {
    const keepEditorUsable = () => {
      if (window.innerWidth < AI_AUTO_COLLAPSE_WIDTH && aiPanelOpen) {
        autoCollapsedAi.current = true;
        setAIPanelOpen(false);
      }
      if (window.innerWidth >= AI_AUTO_COLLAPSE_WIDTH && autoCollapsedAi.current && !aiPanelOpen) {
        autoCollapsedAi.current = false;
        setAIPanelOpen(true);
      }
    };
    keepEditorUsable();
    window.addEventListener("resize", keepEditorUsable);
    return () => window.removeEventListener("resize", keepEditorUsable);
  }, [aiPanelOpen, setAIPanelOpen]);

  useEffect(() => {
    if (rootPath) void refreshGit();
    else clearGit();
    const refresh = () => { if (useWorkspaceStore.getState().rootPath) void useGitStore.getState().refresh(); };
    const dispose = window.zenithDesktop?.git?.onStatusChanged(refresh);
    return () => { dispose?.(); };
  }, [clearGit, refreshGit, rootPath]);

  return (
    <main className={`workspace ${activePanel ? "left-panel-open" : ""} ${aiPanelOpen ? "ai-panel-open" : ""}`}>
      <ActivityBar />
      <SidePanel />
      <div className="editor-workspace"><Editor /></div>
      <AIPanel />
    </main>
  );
}
