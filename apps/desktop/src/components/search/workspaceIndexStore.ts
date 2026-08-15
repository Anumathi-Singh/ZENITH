import { create } from "zustand";
import type { ZenithWorkspaceIndexState } from "../../types/zenith-desktop";
import { unwrapBackendResult } from "../auth/authStore";

const initialState: ZenithWorkspaceIndexState = { status: "idle", rootPath: null, fileCount: 0, version: 0, error: null, watching: false };
export const useWorkspaceIndexStore = create<ZenithWorkspaceIndexState>(() => initialState);
let disposeListener: (() => void) | null = null;

export function initializeWorkspaceIndexBridge() {
  const api = window.zenithDesktop?.workspaceIndex;
  if (!api) return;
  if (!disposeListener) disposeListener = api.onChanged((state) => useWorkspaceIndexStore.setState(state));
  void api.getState().then((result) => useWorkspaceIndexStore.setState(unwrapBackendResult(result))).catch(() => useWorkspaceIndexStore.setState({ ...initialState, status: "error", error: "Workspace indexing is unavailable." }));
}

export function disposeWorkspaceIndexBridge() { disposeListener?.(); disposeListener = null; }
