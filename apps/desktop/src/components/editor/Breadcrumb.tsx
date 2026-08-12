import { ChevronRight, FileCode2, Folder } from "lucide-react";
import { useEditorStore } from "./editorStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";

const pathParts = (filePath?: string) => filePath?.split(/[\\/]/).filter(Boolean) ?? [];

export default function Breadcrumb() {
  const activeTab = useEditorStore((state) => state.tabs.find((tab) => tab.id === state.activeTab));
  const { rootName, rootPath } = useWorkspaceStore();
  const parts = pathParts(activeTab?.path);
  const rootIndex = rootPath ? parts.findIndex((part) => part.toLowerCase() === rootName.toLowerCase()) : -1;
  const visibleParts = rootIndex >= 0 ? parts.slice(rootIndex + 1) : parts;

  if (!activeTab) return <div className="editor-breadcrumb"><span>Zenith workspace</span></div>;

  return (
    <nav className="editor-breadcrumb" aria-label="File breadcrumb">
      <Folder size={14} /><span>{rootName}</span>
      {visibleParts.map((part, index) => <span className="breadcrumb-part" key={`${part}-${index}`}><ChevronRight size={13} />{index === visibleParts.length - 1 ? <strong><FileCode2 size={13} />{part}</strong> : part}</span>)}
    </nav>
  );
}
