import { create } from "zustand";
import type { ZenithBackendResult, ZenithGitStatus } from "../../types/zenith-desktop";
import { notify } from "../ui/uiStore";

interface GitStore {
  available: boolean | null;
  version: string | null;
  isRepository: boolean;
  status: ZenithGitStatus | null;
  loading: boolean;
  operation: string | null;
  error: string | null;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
  initialize: () => Promise<void>;
  stage: (path: string) => Promise<void>;
  unstage: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: () => Promise<void>;
  fetch: () => Promise<void>;
  pull: () => Promise<void>;
  push: () => Promise<void>;
}

function unwrap<T>(result: ZenithBackendResult<T>): T {
  if (result.ok) return result.data;
  throw Object.assign(new Error(result.error.message), { code: result.error.code });
}

async function perform(operation: string, action: () => Promise<ZenithBackendResult<unknown>>, successMessage?: string) {
  if (useGitStore.getState().operation) return;
  useGitStore.setState({ operation, error: null });
  try {
    unwrap(await action());
    if (successMessage) notify(successMessage, "success");
    await useGitStore.getState().refresh();
  } catch (error) {
    const message = error instanceof Error ? error.message : `Git ${operation} failed.`;
    useGitStore.setState({ error: message });
    notify(message, "error");
  } finally {
    useGitStore.setState({ operation: null });
  }
}

export const useGitStore = create<GitStore>((set, get) => ({
  available: null,
  version: null,
  isRepository: false,
  status: null,
  loading: false,
  operation: null,
  error: null,
  commitMessage: "",
  setCommitMessage: (commitMessage) => set({ commitMessage }),
  clear: () => set({ available: null, version: null, isRepository: false, status: null, loading: false, operation: null, error: null, commitMessage: "" }),
  refresh: async () => {
    const api = window.zenithDesktop?.git;
    if (!api) {
      set({ available: false, version: null, isRepository: false, status: null, loading: false, error: "Git is available only in Zenith Desktop." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = unwrap(await api.getStatus());
      set({ available: response.available, version: response.version, isRepository: response.isRepository, status: response.status, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Could not read Git status." });
    }
  },
  initialize: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("initializing", () => api.init(), "Git repository initialized.");
  },
  stage: async (path) => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("staging", () => api.stage([path]));
  },
  unstage: async (path) => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("unstaging", () => api.unstage([path]));
  },
  stageAll: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("staging", () => api.stageAll());
  },
  unstageAll: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("unstaging", () => api.unstageAll());
  },
  commit: async () => {
    const api = window.zenithDesktop?.git;
    const message = get().commitMessage.trim();
    if (!message) {
      set({ error: "Enter a commit message." });
      return;
    }
    if (api) {
      await perform("committing", () => api.commit(message), "Commit created.");
      if (!useGitStore.getState().error) set({ commitMessage: "" });
    }
  },
  fetch: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("fetching", () => api.fetch(), "Fetch completed.");
  },
  pull: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("pulling", () => api.pull(), "Pull completed.");
  },
  push: async () => {
    const api = window.zenithDesktop?.git;
    if (api) await perform("pushing", () => api.push(), "Push completed.");
  },
}));
