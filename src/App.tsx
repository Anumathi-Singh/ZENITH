import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import Workspace from "./components/layout/Workspace";
import Terminal from "./components/terminal/Terminal";
import StatusBar from "./components/layout/StatusBar";
import ResizeHandle from "./components/terminal/ResizeHandle";
import { useTheme } from "./components/theme/useTheme";

function App() {
  const [terminalHeight, setTerminalHeight] = useState(114);
  const { theme, themeName } = useTheme();
  return <div className={`zenith-app theme-${themeName}`} style={{ background: theme.background, color: theme.text }}><TopBar /><Terminal height={terminalHeight} /><ResizeHandle onResize={setTerminalHeight} /><div className="workspace-wrap"><Workspace /></div><StatusBar /></div>;
}
export default App;
