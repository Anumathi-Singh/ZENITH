import { create } from "zustand";

interface EditorPreferences { fontSize: number; minimap: boolean; wordWrap: boolean; setFontSize: (size: number) => void; toggleMinimap: () => void; toggleWordWrap: () => void; setMinimap: (value: boolean) => void; setWordWrap: (value: boolean) => void; }
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* preferences still work in memory */ } };
const saved = Number(read("zenith-font-size"));
export const useEditorPreferences = create<EditorPreferences>((set) => ({
  fontSize: saved >= 12 && saved <= 22 ? saved : 14,
  minimap: read("zenith-minimap") !== "false",
  wordWrap: read("zenith-word-wrap") === "true",
  setFontSize: (size) => { const fontSize = Number.isFinite(size) ? Math.min(22, Math.max(12, size)) : 14; write("zenith-font-size", String(fontSize)); set({ fontSize }); },
  toggleMinimap: () => set((state) => { const minimap = !state.minimap; write("zenith-minimap", String(minimap)); return { minimap }; }),
  toggleWordWrap: () => set((state) => { const wordWrap = !state.wordWrap; write("zenith-word-wrap", String(wordWrap)); return { wordWrap }; }),
  setMinimap: (minimap) => { write("zenith-minimap", String(minimap)); set({ minimap }); },
  setWordWrap: (wordWrap) => { write("zenith-word-wrap", String(wordWrap)); set({ wordWrap }); },
}));

