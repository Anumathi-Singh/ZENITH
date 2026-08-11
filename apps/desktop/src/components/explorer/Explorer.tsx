import { FolderOpen, RotateCw } from "lucide-react";
import FileTree from "./FileTree";
import { useWorkspaceStore } from "./workspaceStore";

export default function Explorer() {
  const { rootName, tree, message, openFolder, refresh } = useWorkspaceStore();

  return <section className="explorer-panel"><header className="explorer-header"><span>EXPLORER</span><div><button title="Open folder" aria-label="Open folder" onClick={() => void openFolder()}><FolderOpen size={16} /></button><button title="Refresh Explorer" aria-label="Refresh Explorer" onClick={() => void refresh()}><RotateCw size={16} /></button></div></header><button className="project-root" onClick={() => void openFolder()}>⌄ {rootName}</button>{tree.length ? <FileTree nodes={tree} /> : <p className="explorer-empty">Open Folder to load a project from your computer.</p>}<p className="explorer-message">{message}</p></section>;
}
