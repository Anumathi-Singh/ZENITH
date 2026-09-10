import { useEffect, useMemo } from "react";
import { useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as localMonaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import type * as Monaco from "monaco-editor";
import { useEditorStore } from "./editorStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { useEditorPreferences } from "./editorPreferences";
import { useWorkspaceStore } from "../explorer/workspaceStore";

// Bundle the installed Monaco version and workers; desktop editing must work offline.
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === "typescript" || label === "javascript") return new TsWorker();
    if (label === "json") return new JsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new HtmlWorker();
    return new EditorWorker();
  },
};
loader.config({ monaco: localMonaco });

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
  const { tabs, activeTab, updateContent, saveTab, revealRequest } = useEditorStore();
  const { selectedThemeId } = useTheme();
  const { fontSize, minimap, wordWrap } = useEditorPreferences();
  const openFolder = useWorkspaceStore((state) => state.openFolder);
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(`zenith-${selectedThemeId}`);
  }, [selectedThemeId]);

  useEffect(() => {
    const paths = new Set(tabs.map((tab) => tab.path ? localMonaco.Uri.file(tab.path).toString() : tab.id));
    // Monaco switches the active model in its own effect before this deferred cleanup.
    const timer = window.setTimeout(() => {
      localMonaco.editor.getModels().forEach((model) => {
        if (!paths.has(model.uri.toString()) && editorRef.current?.getModel() !== model) model.dispose();
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tabs]);

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

  useEffect(() => {
    if (!revealRequest || revealRequest.tabId !== currentTab?.id || !editorRef.current) return;
    editorRef.current.setPosition({ lineNumber: revealRequest.line, column: revealRequest.column });
    editorRef.current.revealLineInCenter(revealRequest.line);
    editorRef.current.focus();
  }, [currentTab?.id, revealRequest]);

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
      path={currentTab.path ? localMonaco.Uri.file(currentTab.path).toString() : currentTab.id}
      language={currentTab.language}
      value={currentTab.content}
      theme={`zenith-${selectedThemeId}`}
      beforeMount={defineZenithThemes}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        monaco.editor.setTheme(`zenith-${selectedThemeId}`);
        const request = useEditorStore.getState().revealRequest;
        if (request?.tabId === currentTab.id) {
          editor.setPosition({ lineNumber: request.line, column: request.column });
          editor.revealLineInCenter(request.line);
          editor.focus();
        }
      }}
      onChange={(value) => updateContent(currentTab.id, value ?? "")}
      options={options}
      keepCurrentModel
      saveViewState
    />
  );
}

