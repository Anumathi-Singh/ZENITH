import { Check, ChevronDown, Cloud, GitBranch, Plus, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";

type ChangeKind = "M" | "A" | "D";
type Change = { id: string; path: string; kind: ChangeKind; staged: boolean };
const initialChanges: Change[] = [
  { id: "app", path: "src/App.tsx", kind: "M", staged: false },
  { id: "workspace", path: "src/components/layout/Workspace.tsx", kind: "M", staged: false },
  { id: "git", path: "src/components/panels/GitPanel.tsx", kind: "A", staged: false },
];

export default function GitPanel() {
  const [changes, setChanges] = useState(initialChanges);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("Working tree ready");
  const staged = useMemo(() => changes.filter((item) => item.staged), [changes]);
  const stageAll = () => setChanges((items) => items.map((item) => ({ ...item, staged: true })));
  const commit = () => { if (!message.trim() || !staged.length) return; setNotice(`Committed ${staged.length} change${staged.length === 1 ? "" : "s"}`); setChanges((items) => items.filter((item) => !item.staged)); setMessage(""); };
  return <section className="zenith-side-panel">
    <header className="panel-header"><div><p className="eyebrow">SOURCE CONTROL</p><h2>Changes</h2></div><button className="icon-button" onClick={() => setNotice("Changes refreshed")}><RotateCw size={16} /></button></header>
    <div className="git-branch"><GitBranch size={16} /><span>main</span><ChevronDown size={15} /></div>
    <div className="changes-heading"><span>CHANGES ({changes.length})</span><button onClick={stageAll} disabled={!changes.length}><Plus size={16} /></button></div>
    <div className="change-list">{changes.length ? changes.map((change) => <button className={`change-row ${change.staged ? "is-staged" : ""}`} key={change.id} onClick={() => setChanges((items) => items.map((item) => item.id === change.id ? { ...item, staged: !item.staged } : item))}><span className={`change-kind ${change.kind}`}>{change.kind}</span><span className="change-path">{change.path}</span>{change.staged && <Check size={15} />}</button>) : <div className="clean-state"><Check size={20} />No pending changes</div>}</div>
    <div className="commit-box"><label htmlFor="commit-message">COMMIT MESSAGE</label><textarea id="commit-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe your changes…" /><button className="primary-action" onClick={commit} disabled={!message.trim() || !staged.length}><Check size={16} />Commit {staged.length ? `(${staged.length})` : ""}</button></div>
    <div className="git-actions"><button onClick={() => setNotice("Sync queued for when a Git backend is connected")}><Cloud size={15} />Sync</button><button onClick={() => setNotice("History will appear here")}>History</button></div><p className="panel-notice">{notice}</p>
  </section>;
}
