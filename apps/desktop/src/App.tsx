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

function App() {
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const { themeName } = useTheme();
  const { density, animations, reducedMotion, panelBorders, showAiOnStartup } = useAppPreferences();
  const setAIPanelOpen = useLayoutStore((state) => state.setAIPanelOpen);
  useEffect(() => { document.documentElement.dataset.density = density; document.documentElement.dataset.panelBorders = String(panelBorders); document.documentElement.dataset.motion = animations && !reducedMotion ? "full" : "reduced"; }, [animations, density, panelBorders, reducedMotion]);
  useEffect(() => { setAIPanelOpen(showAiOnStartup); }, [setAIPanelOpen, showAiOnStartup]);
  const toggleTerminal = () => { setTerminalMaximized(false); setTerminalCollapsed((value) => !value); };
  const toggleMaximizedTerminal = () => { setTerminalCollapsed(false); setTerminalMaximized((value) => !value); };
  return <div className={`zenith-app theme-${themeName}`}><TopBar onToggleTerminal={toggleTerminal} terminalCollapsed={terminalCollapsed} />{!terminalMaximized && <div className="workspace-wrap"><Workspace /></div>}{!terminalMaximized && !terminalCollapsed && <ResizeHandle onResize={setTerminalHeight} />}<Terminal height={terminalHeight} collapsed={terminalCollapsed} maximized={terminalMaximized} onToggleCollapsed={toggleTerminal} onToggleMaximized={toggleMaximizedTerminal} /><StatusBar /><ZenithDialogs /><ToastViewport /></div>;
}
export default App;
