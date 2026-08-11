import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useEditorStore } from "../editor/editorStore";
import { useWorkspaceStore, type WorkspaceNode } from "./workspaceStore";

interface Props { nodes: WorkspaceNode[]; depth?: number; }
export default function FileTree({ nodes, depth = 0 }: Props) { return <div className="space-y-1">{nodes.map((node) => <TreeNode key={node.id} node={node} depth={depth} />)}</div>; }
function TreeNode({ node, depth }: { node: WorkspaceNode; depth: number }) {
  const [open, setOpen] = useState(node.type === "folder" && depth === 0);
  const openTab = useEditorStore((state) => state.openTab);
  const openFile = useWorkspaceStore((state) => state.openFile);
  if (node.type === "folder") return <div><button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-50 text-sm">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<Folder size={15} className="text-violet-500" />{node.name}</button>{open && node.children && <div className="ml-5"><FileTree nodes={node.children as WorkspaceNode[]} depth={depth + 1} /></div>}</div>;
  return <button onClick={() => void openFile(node).then((file) => file && openTab(file))} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-50 text-sm"><FileText size={15} className="text-purple-500" />{node.name}</button>;
}
