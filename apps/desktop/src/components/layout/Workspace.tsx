import ActivityBar from "./ActivityBar";
import SidePanel from "./SidePanel";
import Editor from "../editor/Editor";
import { useLayoutStore } from "./layoutStore";

export default function Workspace() {
  const activePanel = useLayoutStore((state) => state.activePanel);

  return (
    <main className={`h-full min-w-0 flex overflow-hidden transition-all duration-300 ${activePanel ? "gap-4" : "gap-0"}`}>
      <ActivityBar />
      <SidePanel />
      <div className={`min-w-0 flex-1 ${activePanel ? "ml-0" : "ml-4"}`}>
        <Editor />
      </div>
    </main>
  );
}
