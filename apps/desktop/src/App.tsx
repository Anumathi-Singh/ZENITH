import { useState } from "react";

import TopBar from "./components/layout/TopBar";
import Workspace from "./components/layout/Workspace";
import Terminal from "./components/terminal/Terminal";
import StatusBar from "./components/layout/StatusBar";
import ResizeHandle from "./components/terminal/ResizeHandle";

import { useTheme } from "./components/theme/useTheme";

function App() {
  const [terminalHeight, setTerminalHeight] = useState(160);

  const { theme } = useTheme();

  return (
    <div
      className="
        h-screen
        flex
        flex-col
        gap-4
        p-4
        overflow-hidden
        transition-colors
        duration-300
      "
      style={{
        background: theme.background,
        color: theme.text,
      }}
    >
      <TopBar />

      <div
        className="
          flex-1
          min-h-0
          overflow-hidden
        "
      >
        <Workspace />
      </div>

      <ResizeHandle
        onResize={(height: number) => setTerminalHeight(height)}
      />

      <Terminal height={terminalHeight} />

      <StatusBar />
    </div>
  );
}

export default App;