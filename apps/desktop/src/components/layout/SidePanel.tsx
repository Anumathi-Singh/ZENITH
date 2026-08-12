import { useRef, useState } from "react";
import Explorer from "../explorer/Explorer";
import GitPanel from "../panels/GitPanel";
import SearchPanel from "../panels/SearchPanel";
import SettingsPanel from "../panels/SettingsPanel";
import ExtensionsPanel from "../panels/ExtensionsPanel";
import { useLayoutStore } from "./layoutStore";

export default function SidePanel() {
  const { activePanel, sidePanelWidth, aiPanelOpen, aiPanelWidth, setSidePanelWidth } = useLayoutStore();
  const [isResizing, setIsResizing] = useState(false);
  const startWidth = useRef(sidePanelWidth); const startX = useRef(0);
  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); startX.current = event.clientX; startWidth.current = sidePanelWidth; setIsResizing(true);
    const workspace = event.currentTarget.closest(".workspace");
    const resize = (moveEvent: PointerEvent) => { const editorMinimum = 420, activityWidth = 72, panelSpacing = 28; const availableWidth = workspace?.getBoundingClientRect().width ?? window.innerWidth; const rightPanelWidth = aiPanelOpen ? aiPanelWidth : 0; const maximum = Math.max(220, availableWidth - activityWidth - rightPanelWidth - editorMinimum - panelSpacing); setSidePanelWidth(Math.min(startWidth.current + moveEvent.clientX - startX.current, maximum)); };
    const stopResize = () => { setIsResizing(false); window.removeEventListener("pointermove", resize); window.removeEventListener("pointerup", stopResize); window.removeEventListener("pointercancel", stopResize); };
    window.addEventListener("pointermove", resize); window.addEventListener("pointerup", stopResize, { once: true }); window.addEventListener("pointercancel", stopResize, { once: true });
  };
  const resizeByKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => { if (event.key === "ArrowLeft") { event.preventDefault(); setSidePanelWidth(sidePanelWidth - 16); } if (event.key === "ArrowRight") { event.preventDefault(); setSidePanelWidth(sidePanelWidth + 16); } };
  return <aside aria-hidden={!activePanel} className={`side-panel-shell ${activePanel ? "is-open" : ""} ${isResizing ? "is-resizing" : ""}`} style={{ width: activePanel ? sidePanelWidth : 0 }}><div className="side-panel-content" style={{ width: sidePanelWidth }}>{activePanel === "explorer" && <Explorer />}{activePanel === "search" && <SearchPanel />}{activePanel === "git" && <GitPanel />}{activePanel === "settings" && <SettingsPanel />}{activePanel === "extensions" && <ExtensionsPanel />}</div>{activePanel && <div role="separator" aria-orientation="vertical" aria-label="Resize left panel" tabIndex={0} onPointerDown={startResize} onKeyDown={resizeByKeyboard} className="panel-resize-handle panel-resize-handle-right" />}</aside>;
}
