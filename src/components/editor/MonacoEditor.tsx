import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useEditorStore } from "./editorStore";
import { useTheme } from "../theme/useTheme";
import { useEditorPreferences } from "./editorPreferences";

export default function MonacoEditor() {
  const { tabs, activeTab, updateContent, saveTab } = useEditorStore();
  const { themeName } = useTheme();
  const { fontSize, minimap, wordWrap } = useEditorPreferences();
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  useEffect(() => { const saveHandler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); if (currentTab) void saveTab(currentTab.id); } }; window.addEventListener("keydown", saveHandler); return () => window.removeEventListener("keydown", saveHandler); }, [currentTab, saveTab]);
  if (!currentTab) return null;
  return <div className="flex-1 h-full"><Editor height="100%" language={currentTab.language} value={currentTab.content} theme={themeName === "dark" ? "vs-dark" : "vs-light"} onChange={(value) => updateContent(currentTab.id, value ?? "")} options={{ automaticLayout: true, minimap: { enabled: minimap }, fontSize, fontFamily: "'JetBrains Mono', monospace", fontLigatures: true, smoothScrolling: true, cursorBlinking: "smooth", cursorSmoothCaretAnimation: "on", roundedSelection: true, scrollBeyondLastLine: false, wordWrap: wordWrap ? "on" : "off" }} /></div>;
}
