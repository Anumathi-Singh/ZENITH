import { Braces, Check, CircleAlert, GitBranch, ShieldCheck } from "lucide-react";
import { useEditorStore } from "../editor/editorStore";

export default function StatusBar() {
  const { tabs, activeTab, saveMessage } = useEditorStore();
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const fileState = currentTab?.isDirty ? "Modified" : currentTab ? saveMessage === "Saving…" ? "Saving…" : saveMessage === "Saved" ? "Saved" : saveMessage : "No file open";

  return <footer className="status-bar"><div><span><GitBranch size={14} /> main</span><span><CircleAlert size={14} /> 0</span><span>△ 0</span><span><ShieldCheck size={14} /> 0</span></div><div><span className="save-state"><Check size={14} /> {fileState}</span><span>Ln 23, Col 1</span><span>Spaces: 2</span><span>UTF-8</span><span>LF</span><span><Braces size={14} /> TypeScript JSX</span></div></footer>;
}
