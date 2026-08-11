import { useRef } from "react";

const MIN_TERMINAL_HEIGHT = 100;
const MIN_WORKSPACE_HEIGHT = 220;
const RESERVED_VERTICAL_SPACE = 150;

export default function ResizeHandle({ onResize }: { onResize: (height: number) => void }) {
  const isResizing = useRef(false);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isResizing.current = true;

    const resize = (moveEvent: PointerEvent) => {
      if (!isResizing.current) return;
      const maximumHeight = Math.max(MIN_TERMINAL_HEIGHT, window.innerHeight - MIN_WORKSPACE_HEIGHT - RESERVED_VERTICAL_SPACE);
      const nextHeight = window.innerHeight - moveEvent.clientY - RESERVED_VERTICAL_SPACE;
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

  return <div onPointerDown={startResize} className="h-2 w-full shrink-0 cursor-row-resize touch-none rounded-full transition hover:bg-purple-300/70" />;
}
