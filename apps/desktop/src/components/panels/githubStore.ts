import { create } from "zustand";
import type { ZenithGitHubProgress, ZenithGitHubWorkspaceRepository } from "../../types/zenith-desktop";
import { unwrapBackendResult } from "../auth/authStore";

interface GitHubStore {
  repository: ZenithGitHubWorkspaceRepository | null;
  loading: boolean;
  error: string | null;
  progress: ZenithGitHubProgress | null;
  refreshRepository: () => Promise<void>;
  clear: () => void;
}

export const useGitHubStore = create<GitHubStore>((set) => ({
  repository: null,
  loading: false,
  error: null,
  progress: null,
  refreshRepository: async () => {
    const api = window.zenithDesktop?.github;
    if (!api) return;
    set({ loading: true, error: null });
    try {
      set({ repository: unwrapBackendResult(await api.getRepositoryFromCurrentWorkspace()), loading: false });
    } catch (error) {
      set({ repository: null, loading: false, error: error instanceof Error ? error.message : "Could not load GitHub repository metadata." });
    }
  },
  clear: () => set({ repository: null, loading: false, error: null, progress: null }),
}));

let disposeProgress: (() => void) | null = null;

export function initializeGitHubBridge() {
  const api = window.zenithDesktop?.github;
  if (!api || disposeProgress) return;
  disposeProgress = api.onProgress((progress) => useGitHubStore.setState({ progress }));
}

export function disposeGitHubBridge() {
  disposeProgress?.();
  disposeProgress = null;
}
