import Sidebar from "./Sidebar";
import Explorer from "../explorer/Explorer";
import Editor from "../editor/Editor";
import AIPanel from "../ai/AIPanel";


export default function Workspace() {

  return (

    <main
      className="
      h-full
      grid
      grid-cols-[64px_minmax(220px,260px)_1fr_320px]
      gap-4
      overflow-hidden
      "
    >

      {/* Navigation */}
      <Sidebar />


      {/* Files */}
      <Explorer />


      {/* Code Editor */}
      <Editor />


      {/* AI Assistant */}
      <AIPanel />


    </main>

  );
}