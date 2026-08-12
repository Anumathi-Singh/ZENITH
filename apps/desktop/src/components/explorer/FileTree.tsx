import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Copy, FileCode2, Folder, FolderOpen, MoreHorizontal } from "lucide-react";
import { useEditorStore } from "../editor/editorStore";
import { useWorkspaceStore, type WorkspaceNode } from "./workspaceStore";
import { notify } from "../ui/uiStore";

interface Props { nodes: WorkspaceNode[]; depth?: number; }
export default function FileTree({ nodes, depth = 0 }: Props) { return <div className="file-tree">{nodes.map((node) => <TreeNode key={node.id} node={node} depth={depth} />)}</div>; }

function TreeActions({ path, onClose }: { path: string; onClose: () => void }) {
  const copy = async () => { try { if (window.zenithDesktop?.copyText) await window.zenithDesktop.copyText(path); else await navigator.clipboard.writeText(path); notify("Path copied.", "success"); } catch { notify("Could not copy the path.", "error"); } onClose(); };
  return <div className="file-tree-menu zenith-popover"><button onClick={() => void copy()}><Copy size={14} />Copy Path</button><button disabled={!window.zenithDesktop?.revealPath} onClick={() => { void window.zenithDesktop?.revealPath(path); onClose(); }}><FolderOpen size={14} />Reveal in Explorer</button></div>;
}
function TreeNode({ node, depth }: { node: WorkspaceNode; depth: number }) {
  const [open, setOpen] = useState(node.type === "folder" && depth === 0); const [menuOpen, setMenuOpen] = useState(false);
  const openTab = useEditorStore((state) => state.openTab); const { openFile, loadDirectory } = useWorkspaceStore();
  useEffect(() => { const close = () => setMenuOpen(false); window.addEventListener("scroll", close, true); return () => window.removeEventListener("scroll", close, true); }, []);
  const toggleFolder = async () => { const nextOpen = !open; setOpen(nextOpen); if (nextOpen && !node.loaded) await loadDirectory(node.path, node.id); };
  if (node.type === "folder") return <div className="file-tree-folder"><div className="file-tree-row-wrap"><button onClick={() => void toggleFolder()} className="file-tree-row file-tree-folder-row" style={{ paddingLeft: 8 + depth * 14 }}><span className="file-tree-chevron">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>{open ? <FolderOpen size={15} /> : <Folder size={15} />}<span>{node.name}</span></button><button className="file-tree-more" title={`${node.name} actions`} onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal size={15} /></button>{menuOpen && <TreeActions path={node.path} onClose={() => setMenuOpen(false)} />}</div>{open && node.children && <FileTree nodes={node.children as WorkspaceNode[]} depth={depth + 1} />}</div>;
  return <div className="file-tree-row-wrap"><button onClick={() => void openFile(node).then((file) => file && openTab(file))} className="file-tree-row file-tree-file-row" style={{ paddingLeft: 30 + depth * 14 }} title={node.path}><FileCode2 size={14} /><span>{node.name}</span></button><button className="file-tree-more" title={`${node.name} actions`} onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal size={15} /></button>{menuOpen && <TreeActions path={node.path} onClose={() => setMenuOpen(false)} />}</div>;
}
