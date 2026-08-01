import { useState } from "react";

import TopBar from "./components/layout/TopBar";
import Workspace from "./components/layout/Workspace";
import Terminal from "./components/terminal/Terminal";
import StatusBar from "./components/layout/StatusBar";
import ResizeHandle from "./components/terminal/ResizeHandle";


function App() {

  const [terminalHeight, setTerminalHeight] = useState(160);


  return (

    <div
      className="
      h-screen
      flex
      flex-col
      gap-4
      p-4
      overflow-hidden
      bg-[#FBF9FF]
      "
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
        onResize={(height:number)=>setTerminalHeight(height)}
      />


      <Terminal height={terminalHeight} />


      <StatusBar />


    </div>

  );
}


export default App;