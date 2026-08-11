import { FolderOpen, Plus, RotateCw } from "lucide-react";
import FileTree from "./FileTree";
import { fileTree } from "./treeData";
import { useWorkspaceStore } from "./workspaceStore";
import { useEditorStore } from "../editor/editorStore";

export default function Explorer() {
  const { rootName, tree, message, openFolder, createFile, openFile, refresh } = useWorkspaceStore();
  const openTab = useEditorStore((state) => state.openTab);
  const nodes = tree.length ? tree : fileTree;
  const newFile = () => { const name = window.prompt("New file name", "untitled.ts"); if (!name) return; const file = createFile(name); if (file) void openFile(file).then((tab) => tab && openTab(tab)); };
  return <section className="explorer-panel"><header className="explorer-header"><span>EXPLORER</span><div><button title="Open folder" onClick={() => void openFolder()}><FolderOpen size={16} /></button><button title="New file" onClick={newFile}><Plus size={16} /></button><button title="Refresh Explorer" onClick={refresh}><RotateCw size={16} /></button></div></header><button className="project-root" onClick={() => void openFolder()}>⌄ {rootName}</button><FileTree nodes={nodes} /><p className="explorer-message">{message}</p></section>;
}
