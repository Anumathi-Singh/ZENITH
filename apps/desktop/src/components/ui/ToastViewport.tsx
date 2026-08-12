import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { useUiStore, type ToastKind } from "./uiStore";

const icons: Record<ToastKind, typeof Info> = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: CircleAlert };

function Toast({ id, kind, message }: { id: number; kind: ToastKind; message: string }) {
  const dismiss = useUiStore((state) => state.dismissToast);
  useEffect(() => { const timer = window.setTimeout(() => dismiss(id), 4200); return () => window.clearTimeout(timer); }, [dismiss, id]);
  const Icon = icons[kind];
  return <article className={`zenith-toast toast-${kind}`} role="status"><Icon size={17} /><span>{message}</span><button title="Dismiss notification" onClick={() => dismiss(id)}><X size={15} /></button></article>;
}

export default function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  return <div className="toast-viewport" aria-live="polite">{toasts.map((toast) => <Toast key={toast.id} {...toast} />)}</div>;
}
