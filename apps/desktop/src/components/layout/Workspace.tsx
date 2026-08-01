import Sidebar from "./Sidebar";
import Explorer from "../explorer/Explorer";
import Editor from "../editor/Editor";
import AIPanel from "../ai/AIPanel";

export default function Workspace() {
  return (
    <main
  className="
    flex-1
    grid
    gap-4
    grid-cols-[64px_minmax(220px,260px)_minmax(400px,1fr)_300px]
    overflow-hidden
  "
>
      <Sidebar />
      <Explorer />
      <Editor />
      <AIPanel />
    </main>
  );
}