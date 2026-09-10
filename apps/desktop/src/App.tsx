import { useEffect, useState } from "react";
import TopBar from "./components/layout/TopBar";
import Workspace from "./components/layout/Workspace";
import Terminal from "./components/terminal/Terminal";
import StatusBar from "./components/layout/StatusBar";
import ResizeHandle from "./components/terminal/ResizeHandle";
import { useTheme } from "./components/theme/useTheme";
import ToastViewport from "./components/ui/ToastViewport";
import ZenithDialogs from "./components/ui/ZenithDialogs";
import { useAppPreferences } from "./components/settings/appPreferences";
import { useLayoutStore } from "./components/layout/layoutStore";
import { useUiStore } from "./components/ui/uiStore";
import SettingsView from "./components/settings/SettingsView";
import { useEditorStore } from "./components/editor/editorStore";
import { disposeAuthBridge, initializeAuthBridge } from "./components/auth/authStore";
import { disposeGitHubBridge, initializeGitHubBridge } from "./components/panels/githubStore";
import { disposeWorkspaceIndexBridge, initializeWorkspaceIndexBridge } from "./components/search/workspaceIndexStore";

function App() {
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const { selectedThemeId } = useTheme();
  const { density, animations, reducedMotion, panelBorders, panelTransparency, showAiOnStartup } = useAppPreferences();
  const setAIPanelOpen = useLayoutStore((state) => state.setAIPanelOpen);
  const { settingsOpen, closeSettings } = useUiStore();
  useEffect(() => {
    if (terminalCollapsed || terminalMaximized) return;
    const clampTerminal = () => {
      const workspace = document.querySelector(".workspace-wrap")?.getBoundingClientRect();
      const terminal = document.querySelector(".terminal-panel")?.getBoundingClientRect();
      if (workspace && terminal) setTerminalHeight((height) => Math.min(height, Math.max(120, workspace.height + terminal.height - 240)));
    };
    clampTerminal();
    window.addEventListener("resize", clampTerminal);
    return () => window.removeEventListener("resize", clampTerminal);
  }, [terminalCollapsed, terminalMaximized]);
  useEffect(() => {
    const protectEdits = (event: BeforeUnloadEvent) => {
      if (useEditorStore.getState().tabs.some((tab) => tab.isDirty || tab.isSaving)) {
        event.preventDefault(); event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", protectEdits);
    return () => window.removeEventListener("beforeunload", protectEdits);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = density; root.dataset.panelBorders = String(panelBorders);
    root.dataset.transparency = String(panelTransparency);
    root.dataset.motion = animations && !reducedMotion ? "full" : "reduced";
  }, [animations, density, panelBorders, panelTransparency, reducedMotion]);
  useEffect(() => { setAIPanelOpen(showAiOnStartup); }, [setAIPanelOpen, showAiOnStartup]);
  useEffect(() => {
    initializeAuthBridge();
    initializeGitHubBridge();
    initializeWorkspaceIndexBridge();
    return () => { disposeAuthBridge(); disposeGitHubBridge(); disposeWorkspaceIndexBridge(); };
  }, []);
  const toggleTerminal = () => { setTerminalMaximized(false); setTerminalCollapsed((value) => !value); };
  const toggleMaximizedTerminal = () => { setTerminalCollapsed(false); setTerminalMaximized((value) => !value); };
  return <div className={`zenith-app theme-${selectedThemeId}`}><TopBar onToggleTerminal={toggleTerminal} terminalCollapsed={terminalCollapsed} /><div className="workspace-wrap" style={{ display: terminalMaximized ? "none" : undefined }}><Workspace /></div>{!terminalMaximized && !terminalCollapsed && <ResizeHandle onResize={setTerminalHeight} />}<Terminal height={terminalHeight} collapsed={terminalCollapsed} maximized={terminalMaximized} onToggleCollapsed={toggleTerminal} onToggleMaximized={toggleMaximizedTerminal} /><StatusBar />{settingsOpen && <div className="settings-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSettings(); }}><SettingsView /></div>}<ZenithDialogs /><ToastViewport /></div>;
}
export default App;
