import { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useEditorStore } from "./editorStore";

export default function MonacoEditor() {

  const {
    tabs,
    activeTab,
    updateContent,
    markSaved,
  } = useEditorStore();


  const currentTab = tabs.find(
    (tab) => tab.id === activeTab
  );


  useEffect(() => {

    const saveHandler = (event: KeyboardEvent) => {

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "s"
      ) {

        event.preventDefault();


        if (currentTab) {

          markSaved(currentTab.id);

          console.log(
            "Saved:",
            currentTab.name
          );

        }

      }

    };


    window.addEventListener(
      "keydown",
      saveHandler
    );


    return () => {

      window.removeEventListener(
        "keydown",
        saveHandler
      );

    };


  }, [currentTab, markSaved]);



  if (!currentTab) return null;



  return (

    <div className="flex-1 h-full">

      <Editor

        height="100%"

        language={currentTab.language}

        value={currentTab.content}

        theme="vs-light"


        onChange={(value) =>
          updateContent(
            currentTab.id,
            value ?? ""
          )
        }


        options={{

          automaticLayout: true,

          minimap:{
            enabled:true,
          },

          fontSize:14,

          fontFamily:
            "'JetBrains Mono', monospace",

          fontLigatures:true,

          smoothScrolling:true,

          cursorBlinking:"smooth",

          cursorSmoothCaretAnimation:"on",

          roundedSelection:true,

          scrollBeyondLastLine:false,

          wordWrap:"off",

        }}

      />

    </div>

  );
}

