import { useRef } from "react";
import AIPanel from "../ai/AIPanel";
import Explorer from "../explorer/Explorer";
import GitPanel from "../panels/GitPanel";
import SearchPanel from "../panels/SearchPanel";
import SettingsPanel from "../panels/SettingsPanel";
import { useLayoutStore } from "./layoutStore";

export default function SidePanel() {
  const { activePanel, sidePanelWidth, setSidePanelWidth } = useLayoutStore();
  const startWidth = useRef(sidePanelWidth);
  const startX = useRef(0);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    startX.current = event.clientX;
    startWidth.current = sidePanelWidth;

    const resize = (moveEvent: PointerEvent) => {
      const editorMinimum = 360;
      const activityBarWidth = 64;
      const workspaceGaps = 48;
      const viewportMaximum = Math.max(220, window.innerWidth - activityBarWidth - editorMinimum - workspaceGaps);
      setSidePanelWidth(Math.min(startWidth.current + moveEvent.clientX - startX.current, viewportMaximum));
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  };

  return (
    <aside
      className={`relative h-full min-h-0 shrink-0 overflow-hidden rounded-3xl border transition-[width,opacity,transform] duration-300 ease-in-out ${activePanel ? "border-purple-100 opacity-100 translate-x-0" : "border-transparent opacity-0 -translate-x-5 pointer-events-none"}`}
      style={{ width: activePanel ? sidePanelWidth : 0 }}
    >
      <div className="h-full overflow-hidden" style={{ width: sidePanelWidth }}>
        {activePanel === "explorer" && <Explorer />}
        {activePanel === "nova" && <AIPanel />}
        {activePanel === "search" && <SearchPanel />}
        {activePanel === "git" && <GitPanel />}
        {activePanel === "settings" && <SettingsPanel />}
      </div>

      {activePanel && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize side panel"
          onPointerDown={startResize}
          className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none transition-colors hover:bg-purple-300/60"
        />
      )}
    </aside>
  );
}
