import { create } from "zustand";

interface EditorPreferences { fontSize: number; minimap: boolean; wordWrap: boolean; setFontSize: (size: number) => void; toggleMinimap: () => void; toggleWordWrap: () => void; setMinimap: (value: boolean) => void; setWordWrap: (value: boolean) => void; }
const saved = Number(localStorage.getItem("zenith-font-size"));
export const useEditorPreferences = create<EditorPreferences>((set) => ({
  fontSize: saved >= 12 && saved <= 22 ? saved : 14,
  minimap: localStorage.getItem("zenith-minimap") !== "false",
  wordWrap: localStorage.getItem("zenith-word-wrap") === "true",
  setFontSize: (fontSize) => { localStorage.setItem("zenith-font-size", String(fontSize)); set({ fontSize }); },
  toggleMinimap: () => set((state) => { const minimap = !state.minimap; localStorage.setItem("zenith-minimap", String(minimap)); return { minimap }; }),
  toggleWordWrap: () => set((state) => { const wordWrap = !state.wordWrap; localStorage.setItem("zenith-word-wrap", String(wordWrap)); return { wordWrap }; }),
  setMinimap: (minimap) => { localStorage.setItem("zenith-minimap", String(minimap)); set({ minimap }); },
  setWordWrap: (wordWrap) => { localStorage.setItem("zenith-word-wrap", String(wordWrap)); set({ wordWrap }); },
}));

