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
  return <div className={`zenith-app theme-${selectedThemeId}`}><TopBar onToggleTerminal={toggleTerminal} terminalCollapsed={terminalCollapsed} />{!terminalMaximized && <div className="workspace-wrap"><Workspace /></div>}{!terminalMaximized && !terminalCollapsed && <ResizeHandle onResize={setTerminalHeight} />}<Terminal height={terminalHeight} collapsed={terminalCollapsed} maximized={terminalMaximized} onToggleCollapsed={toggleTerminal} onToggleMaximized={toggleMaximizedTerminal} /><StatusBar />{settingsOpen && <div className="settings-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSettings(); }}><SettingsView /></div>}<ZenithDialogs /><ToastViewport /></div>;
}
export default App;
