import { create } from "zustand";
import type { ZenithAuthProvider, ZenithAuthState, ZenithBackendResult } from "../../types/zenith-desktop";
import { notify } from "../ui/uiStore";

const unavailable = { available: false, configured: false, authenticated: false };
const initialState: ZenithAuthState = {
  session: null,
  pending: null,
  providers: {
    github: { available: true, configured: false, authenticated: false, secureStorageAvailable: false },
    google: unavailable,
    microsoft: unavailable,
    zenith: unavailable,
  },
  error: null,
};

interface AuthStore extends ZenithAuthState {
  loading: boolean;
  applyState: (state: ZenithAuthState) => void;
  startGitHubSignIn: () => Promise<void>;
  cancelGitHubSignIn: () => Promise<void>;
  signOut: (provider?: ZenithAuthProvider) => Promise<void>;
}

function unwrap<T>(result: ZenithBackendResult<T>): T {
  if (result.ok) return result.data;
  throw Object.assign(new Error(result.error.message), { code: result.error.code });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  loading: false,
  applyState: (state) => set({ ...state, loading: false }),
  startGitHubSignIn: async () => {
    const api = window.zenithDesktop?.auth;
    if (!api) { notify("GitHub sign-in is available only in Zenith Desktop.", "error"); return; }
    set({ loading: true, error: null });
    try {
      set({ ...unwrap(await api.startGitHubSignIn()), loading: false });
    } catch (error) {
      const message = errorMessage(error, "Could not start GitHub sign-in.");
      set({ loading: false, error: { code: "GITHUB_AUTH_FAILED", message } });
      notify(message, "error");
    }
  },
  cancelGitHubSignIn: async () => {
    const api = window.zenithDesktop?.auth;
    if (!api) return;
    try { set({ ...unwrap(await api.cancelGitHubSignIn()), loading: false }); }
    catch (error) { notify(errorMessage(error, "Could not cancel GitHub sign-in."), "error"); }
  },
  signOut: async (provider = "github") => {
    const api = window.zenithDesktop?.auth;
    if (!api) return;
    set({ loading: true, error: null });
    try {
      set({ ...unwrap(await api.signOut(provider)), loading: false });
      notify("GitHub account disconnected. Local files and repositories were not changed.", "success");
    } catch (error) {
      const message = errorMessage(error, "Could not disconnect GitHub.");
      set({ loading: false, error: { code: "AUTH_SIGN_OUT_FAILED", message } });
      notify(message, "error");
    }
  },
}));

let disposeListener: (() => void) | null = null;

export function initializeAuthBridge() {
  const api = window.zenithDesktop?.auth;
  if (!api) return;
  if (!disposeListener) {
    disposeListener = api.onChanged((state) => {
      const previous = useAuthStore.getState();
      useAuthStore.getState().applyState(state);
      if (!previous.session && state.session) notify(`Connected to GitHub as @${state.session.user.login}.`, "success");
      else if (state.error && state.error.message !== previous.error?.message) notify(state.error.message, "error");
    });
  }
  useAuthStore.setState({ loading: true });
  void api.getState().then((result) => {
    useAuthStore.getState().applyState(unwrap(result));
  }).catch((error) => {
    const message = errorMessage(error, "Could not restore account state.");
    useAuthStore.setState({ loading: false, error: { code: "AUTH_RESTORE_FAILED", message } });
  });
}

export function disposeAuthBridge() {
  disposeListener?.();
  disposeListener = null;
}

export { unwrap as unwrapBackendResult };
