import ActivityBar from "./ActivityBar";
import SidePanel from "./SidePanel";
import Editor from "../editor/Editor";

import { useLayoutStore } from "./layoutStore";


export default function Workspace() {

  const {
    activePanel,
  } = useLayoutStore();


  return (
    <main
      className={`
        h-full
        grid
        ${
          activePanel
            ? "grid-cols-[64px_280px_1fr]"
            : "grid-cols-[64px_0px_1fr]"
        }
        gap-4
        overflow-hidden
        transition-all
        duration-300
      `}
    >

      <ActivityBar />

      <SidePanel />

      <Editor />

    </main>
  );
}