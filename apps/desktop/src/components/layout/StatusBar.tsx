import { Check, CircleAlert, FileCode2, FolderOpen } from "lucide-react";
import { useEditorStore } from "../editor/editorStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";

export default function StatusBar() {
  const { tabs, activeTab, saveMessage } = useEditorStore();
  const { rootName, rootPath } = useWorkspaceStore();
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const fileState = currentTab?.isDirty ? "Modified" : currentTab ? saveMessage : "No file open";
  const hasSaveError = fileState !== "Saved" && fileState !== "Modified" && fileState !== "Saving…" && fileState !== "No file open";

  return <footer className="status-bar"><div><span><FolderOpen size={13} />{rootPath ? rootName : "No workspace"}</span></div><div><span className={`save-state ${hasSaveError ? "is-error" : ""}`}>{hasSaveError ? <CircleAlert size={13} /> : <Check size={13} />}{fileState}</span>{currentTab && <><span><FileCode2 size={13} />{currentTab.language}</span><span>UTF-8</span></>}</div></footer>;
}
