import { useRef } from "react";

const MIN_TERMINAL_HEIGHT = 120;
const MIN_WORKSPACE_HEIGHT = 240;

export default function ResizeHandle({ onResize }: { onResize: (height: number) => void }) {
  const isResizing = useRef(false);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isResizing.current = true;
    const app = event.currentTarget.closest(".zenith-app");
    const workspace = document.querySelector<HTMLElement>(".workspace-wrap");
    const statusBar = document.querySelector<HTMLElement>(".status-bar");

    const resize = (moveEvent: PointerEvent) => {
      if (!isResizing.current || !app || !statusBar) return;
      const workspaceTop = workspace?.getBoundingClientRect().top ?? app.getBoundingClientRect().top;
      const terminalBottom = statusBar.getBoundingClientRect().top - 8;
      const maximumHeight = Math.max(MIN_TERMINAL_HEIGHT, terminalBottom - workspaceTop - MIN_WORKSPACE_HEIGHT);
      const nextHeight = terminalBottom - moveEvent.clientY;
      onResize(Math.min(maximumHeight, Math.max(MIN_TERMINAL_HEIGHT, nextHeight)));
    };
    const stopResize = () => {
      isResizing.current = false;
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  };

  return <div onPointerDown={startResize} className="terminal-resize-handle" role="separator" aria-orientation="horizontal" aria-label="Resize terminal" />;
}
