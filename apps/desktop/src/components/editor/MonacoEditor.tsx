import { useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import zenithMark from "../../assets/logo/zenith-mark-transparent.png";
import { useEditorStore } from "./editorStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { useEditorPreferences } from "./editorPreferences";

function defineZenithThemes(monaco: typeof Monaco) {
  Object.entries(themes).forEach(([name, theme]) => {
    monaco.editor.defineTheme(`zenith-${name}`, {
      base: theme.mode === "dark" ? "vs-dark" : "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: theme.muted.replace("#", ""), fontStyle: "italic" },
        { token: "keyword", foreground: theme.accent.replace("#", "") },
        { token: "string", foreground: theme.mode === "dark" ? "C6D69A" : "6A7C39" },
        { token: "number", foreground: theme.accentWarm.replace("#", "") },
        { token: "type.identifier", foreground: theme.mode === "dark" ? "A9C7FF" : "496BB5" },
      ],
      colors: {
        "editor.background": theme.editorBackground,
        "editor.foreground": theme.text,
        "editorLineNumber.foreground": theme.muted,
        "editorLineNumber.activeForeground": theme.text,
        "editorCursor.foreground": theme.accentWarm,
        "editor.selectionBackground": theme.selection,
        "editor.inactiveSelectionBackground": theme.accentSoft,
        "editor.lineHighlightBackground": theme.surfaceMuted,
        "editorGutter.background": theme.editorBackground,
        "editorIndentGuide.background1": theme.border,
        "editorIndentGuide.activeBackground1": theme.borderStrong,
        "editorWhitespace.foreground": theme.border,
        "editorWidget.background": theme.surfaceRaised,
        "editorWidget.border": theme.borderStrong,
        "editorSuggestWidget.background": theme.surfaceRaised,
        "minimap.background": theme.editorBackground,
        "scrollbarSlider.background": `${theme.borderStrong}88`,
        "scrollbarSlider.hoverBackground": theme.borderStrong,
      },
    });
  });
}

export default function MonacoEditor() {
  const { tabs, activeTab, updateContent, saveTab } = useEditorStore();
  const { themeName } = useTheme();
  const { fontSize, minimap, wordWrap } = useEditorPreferences();
  const currentTab = tabs.find((tab) => tab.id === activeTab);

  useEffect(() => {
    const saveHandler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (currentTab) void saveTab(currentTab.id);
      }
    };
    window.addEventListener("keydown", saveHandler);
    return () => window.removeEventListener("keydown", saveHandler);
  }, [currentTab, saveTab]);

  const options = useMemo(() => ({
    automaticLayout: true,
    minimap: { enabled: minimap },
    fontSize,
    fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
    fontLigatures: true,
    smoothScrolling: true,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    roundedSelection: true,
    scrollBeyondLastLine: false,
    wordWrap: wordWrap ? "on" as const : "off" as const,
    padding: { top: 12, bottom: 18 },
  }), [fontSize, minimap, wordWrap]);

  if (!currentTab) {
    return <div className="editor-empty-state"><img src={zenithMark} alt="Zenith" /><h2>Ready when you are</h2><p>Open a folder, then choose a file to begin editing.</p></div>;
  }

  return (
    <Editor
      height="100%"
      path={currentTab.path ?? currentTab.id}
      language={currentTab.language}
      value={currentTab.content}
      theme={`zenith-${themeName}`}
      beforeMount={defineZenithThemes}
      onChange={(value) => updateContent(currentTab.id, value ?? "")}
      options={options}
      keepCurrentModel
      saveViewState
    />
  );
}

