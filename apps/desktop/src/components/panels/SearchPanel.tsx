import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useEditorStore } from "../editor/editorStore";
import { useWorkspaceStore, type WorkspaceNode } from "../explorer/workspaceStore";

function flatten(nodes: WorkspaceNode[]): WorkspaceNode[] { return nodes.flatMap((node) => node.type === "folder" ? flatten(node.children as WorkspaceNode[]) : [node]); }

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const tree = useWorkspaceStore((state) => state.tree);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const openTab = useEditorStore((state) => state.openTab);
  const results = useMemo(() => query.trim() ? flatten(tree).filter((node) => node.name.toLowerCase().includes(query.toLowerCase())).slice(0, 20) : [], [query, tree]);
  return <section className="zenith-side-panel search-panel"><header className="panel-header"><div><p className="eyebrow">SEARCH</p><h2>Find files</h2></div></header><label className="panel-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search loaded files" /></label><div className="search-results">{query && !tree.length && <p>Open a folder first to search its files.</p>}{results.map((file) => <button key={file.id} onClick={() => void openFile(file).then((tab) => tab && openTab(tab))}><Search size={14} /><span>{file.name}</span><small>{file.path}</small></button>)}{query && tree.length > 0 && !results.length && <p>No loaded files match “{query}”. Expand a folder to include its files.</p>}{!query && <p>Searches the folders already loaded in the real workspace.</p>}</div></section>;
}
