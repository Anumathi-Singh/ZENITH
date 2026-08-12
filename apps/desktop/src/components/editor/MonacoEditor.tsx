import { useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEditorStore } from "./editorStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { useEditorPreferences } from "./editorPreferences";
import { useWorkspaceStore } from "../explorer/workspaceStore";

function defineZenithThemes(monaco: typeof Monaco) {
  Object.entries(themes).forEach(([name, theme]) => {
    const palette = theme.monaco;
    const color = (value: string) => value.replace("#", "");
    monaco.editor.defineTheme(`zenith-${name}`, {
      base: palette.mode === "dark" ? "vs-dark" : "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: color(palette.syntax.comment), fontStyle: "italic" },
        { token: "keyword", foreground: color(palette.syntax.keyword) },
        { token: "string", foreground: color(palette.syntax.string) },
        { token: "number", foreground: color(palette.syntax.number) },
        { token: "type.identifier", foreground: color(palette.syntax.type) },
        { token: "function", foreground: color(palette.syntax.function) },
        { token: "variable", foreground: color(palette.syntax.variable) },
        { token: "constant", foreground: color(palette.syntax.constant) },
      ],
      colors: {
        "editor.background": palette.background,
        "editor.foreground": palette.foreground,
        "editorLineNumber.foreground": palette.lineNumber,
        "editorLineNumber.activeForeground": palette.activeLineNumber,
        "editorCursor.foreground": palette.cursor,
        "editor.selectionBackground": palette.selection,
        "editor.inactiveSelectionBackground": palette.inactiveSelection,
        "editor.lineHighlightBackground": palette.currentLine,
        "editorGutter.background": palette.gutter,
        "editorIndentGuide.background1": palette.indentGuide,
        "editorIndentGuide.activeBackground1": palette.activeIndentGuide,
        "editorBracketPairGuide.background1": palette.bracketGuide,
        "editorWhitespace.foreground": palette.indentGuide,
        "editorWidget.background": theme.floating.elevated,
        "editorWidget.border": theme.floating.border,
        "editorSuggestWidget.background": theme.floating.elevated,
        "editorSuggestWidget.border": theme.floating.border,
        "minimap.background": palette.minimap,
        "scrollbarSlider.background": `${palette.scrollbar}88`,
        "scrollbarSlider.hoverBackground": palette.scrollbarHover,
        "editor.findMatchBackground": palette.findMatch,
        "editor.findMatchHighlightBackground": palette.findHighlight,
        "editor.wordHighlightBackground": palette.wordHighlight,
      },
    });
  });
}

export default function MonacoEditor() {
  const { tabs, activeTab, updateContent, saveTab } = useEditorStore();
  const { themeName } = useTheme();
  const { fontSize, minimap, wordWrap } = useEditorPreferences();
  const openFolder = useWorkspaceStore((state) => state.openFolder);
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
    return <div className="editor-empty-state"><h2>Ready when you are</h2><p>Open a folder, then choose a file to begin editing.</p><button onClick={() => void openFolder()}>Open Folder</button></div>;
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

