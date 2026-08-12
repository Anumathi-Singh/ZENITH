import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "small" | "medium" | "large";
}

export default function Dialog({ title, subtitle, children, onClose, size = "medium" }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [onClose]);

  return (
    <div className="zenith-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={`zenith-dialog dialog-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="dialog-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button title="Close dialog" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
        <div className="dialog-content">{children}</div>
      </section>
    </div>
  );
}
