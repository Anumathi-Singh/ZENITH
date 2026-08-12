import { create } from "zustand";

export type DialogName = "auth" | "github" | "about" | "shortcuts" | "repository" | "help";
export type AuthMode = "signin" | "signup" | "forgot";
export type RepositoryMode = "clone" | "open" | "initialize";
export type ToastKind = "info" | "success" | "warning" | "error";

export interface ToastNotice { id: number; message: string; kind: ToastKind; }
export interface AppNotification extends ToastNotice { read: boolean; createdAt: number; }

interface UiStore {
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  settingsCategory: string;
  dialog: { name: DialogName; mode?: AuthMode | RepositoryMode } | null;
  toasts: ToastNotice[];
  notifications: AppNotification[];
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openSettings: (category?: string) => void;
  closeSettings: () => void;
  setSettingsCategory: (category: string) => void;
  openDialog: (name: DialogName, mode?: AuthMode | RepositoryMode) => void;
  closeDialog: () => void;
  pushToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
}

let nextNoticeId = 1;

export const useUiStore = create<UiStore>((set) => ({
  commandPaletteOpen: false,
  settingsOpen: false,
  settingsCategory: "Appearance",
  dialog: null,
  toasts: [],
  notifications: [],
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openSettings: (category) => set({ settingsOpen: true, settingsCategory: category ?? "Appearance" }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsCategory: (settingsCategory) => set({ settingsCategory }),
  openDialog: (name, mode) => set({ dialog: { name, mode } }),
  closeDialog: () => set({ dialog: null }),
  pushToast: (message, kind = "info") => set((state) => {
    const notice = { id: nextNoticeId++, message, kind };
    return {
      toasts: [...state.toasts, notice].slice(-4),
      notifications: [{ ...notice, read: false, createdAt: Date.now() }, ...state.notifications].slice(0, 30),
    };
  }),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((notification) => ({ ...notification, read: true })) })),
  clearNotifications: () => set({ notifications: [] }),
}));

export const notify = (message: string, kind: ToastKind = "info") => useUiStore.getState().pushToast(message, kind);
