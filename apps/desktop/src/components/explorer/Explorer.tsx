import { FolderOpen, RotateCw } from "lucide-react";
import FileTree from "./FileTree";
import { useWorkspaceStore } from "./workspaceStore";

export default function Explorer() {
  const { rootName, rootPath, tree, message, openFolder, refresh } = useWorkspaceStore();

  return (
    <section className="explorer-panel">
      <header className="explorer-header"><span>EXPLORER</span><div><button title="Open folder" aria-label="Open folder" onClick={() => void openFolder()}><FolderOpen size={16} /></button><button title="Refresh Explorer" aria-label="Refresh Explorer" onClick={() => void refresh()} disabled={!rootPath}><RotateCw size={16} /></button></div></header>
      <button className="project-root" title="Choose a different folder" onClick={() => void openFolder()}><span className="project-chevron">⌄</span>{rootName}</button>
      {tree.length ? <FileTree nodes={tree} /> : <div className="explorer-empty"><FolderOpen size={22} /><p>{rootPath ? "This folder has no visible files." : "Open a folder to load a real project from your computer."}</p><button onClick={() => void openFolder()}>Open Folder</button></div>}
      <p className="explorer-message" role="status">{message}</p>
    </section>
  );
}
