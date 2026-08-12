import { Blocks, Download, Puzzle, Search } from "lucide-react";
import { useState } from "react";
import { notify } from "../ui/uiStore";

const suggestions = [
  ["Prettier", "Code formatter", "Formatting support will be available when the extension host is connected."],
  ["ESLint", "Code quality", "Lint integration is planned for a future local extension service."],
  ["GitHub Pull Requests", "Collaboration", "GitHub needs to be connected first."],
];

export default function ExtensionsPanel() {
  const [query, setQuery] = useState("");
  const results = suggestions.filter(([name, description]) => `${name} ${description}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="zenith-side-panel extensions-panel"><header className="panel-header"><div><p className="eyebrow">WORKSPACE</p><h2>Extensions</h2></div><Blocks size={18} /></header><label className="panel-input"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search extensions" /></label><p className="extensions-note">The extension gallery is not connected yet. These are helpful ideas, not installed extensions.</p><div className="extension-list">{results.map(([name, description, detail]) => <article key={name}><div><Puzzle size={17} /><span><strong>{name}</strong><small>{description}</small></span></div><p>{detail}</p><button onClick={() => notify(`${name} needs the local extension host before it can be installed.`, "info")}><Download size={14} />Learn more</button></article>)}</div></section>;
}
