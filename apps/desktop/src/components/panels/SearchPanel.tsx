import { FileCode2, LoaderCircle, Search } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ZenithTextSearchResult } from "../../types/zenith-desktop";
import { unwrapBackendResult } from "../auth/authStore";
import { useEditorStore } from "../editor/editorStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useWorkspaceIndexStore } from "../search/workspaceIndexStore";

function HighlightedPreview({ result }: { result: ZenithTextSearchResult }) {
  const ranges = result.matches.slice().sort((left, right) => left.start - right.start);
  const segments = ranges.map((range, index) => {
    const previousEnd = index ? ranges[index - 1].end : 0;
    const start = Math.max(previousEnd, range.start); const end = Math.max(start, range.end);
    return <Fragment key={`${start}-${end}-${index}`}>{result.preview.slice(previousEnd, start)}<mark>{result.preview.slice(start, end)}</mark></Fragment>;
  });
  const finalEnd = ranges.length ? ranges[ranges.length - 1].end : 0;
  return <span className="search-preview">{segments}{result.preview.slice(finalEnd)}</span>;
}

export default function SearchPanel() {
  const [query, setQuery] = useState(""); const [include, setInclude] = useState(""); const [exclude, setExclude] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false); const [wholeWord, setWholeWord] = useState(false); const [regex, setRegex] = useState(false);
  const [results, setResults] = useState<ZenithTextSearchResult[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [progress, setProgress] = useState<string | null>(null);
  const activeSearch = useRef(""); const sequence = useRef(0);
  const rootPath = useWorkspaceStore((state) => state.rootPath); const openFilePath = useWorkspaceStore((state) => state.openFilePath);
  const openTab = useEditorStore((state) => state.openTab); const revealLocation = useEditorStore((state) => state.revealLocation); const indexState = useWorkspaceIndexStore();

  useEffect(() => window.zenithDesktop?.search.onProgress((value) => { if (value.searchId === activeSearch.current) setProgress(`${value.processedFiles} / ${value.totalFiles} files`); }), []);
  useEffect(() => {
    const api = window.zenithDesktop?.search; const trimmed = query.trim();
    if (!api || !rootPath || !trimmed) { if (activeSearch.current) void api?.cancel(activeSearch.current); activeSearch.current = ""; return; }
    const searchId = `panel-${Date.now()}-${++sequence.current}`; const previous = activeSearch.current; activeSearch.current = searchId; if (previous) void api.cancel(previous);
    const timer = window.setTimeout(() => { setLoading(true); setError(null); setProgress(null); void api.text({ searchId, query: trimmed, caseSensitive, wholeWord, regex, include, exclude, limit: 500 }).then((response) => {
      if (activeSearch.current !== searchId) return; setResults(unwrapBackendResult(response)); setLoading(false); setProgress(null);
    }).catch((reason: unknown) => { if (activeSearch.current !== searchId || (reason as { code?: string })?.code === "SEARCH_CANCELLED") return; setResults([]); setLoading(false); setProgress(null); setError(reason instanceof Error ? reason.message : "Workspace search failed."); }); }, 220);
    return () => { window.clearTimeout(timer); void api.cancel(searchId); };
  }, [caseSensitive, exclude, include, query, regex, rootPath, wholeWord]);

  const visibleResults = useMemo(() => rootPath && query.trim() ? results : [], [query, results, rootPath]);
  const visibleError = rootPath && query.trim() ? error : null;
  const isSearching = Boolean(rootPath && query.trim() && loading);
  const grouped = useMemo(() => { const groups = new Map<string, ZenithTextSearchResult[]>(); for (const result of visibleResults) groups.set(result.relativePath, [...(groups.get(result.relativePath) || []), result]); return [...groups.entries()]; }, [visibleResults]);
  const openResult = async (result: ZenithTextSearchResult) => { const tab = await openFilePath(result.path); if (!tab) return; openTab(tab); revealLocation(tab.id, result.line, result.column); };

  return <section className="zenith-side-panel search-panel"><header className="panel-header"><div><p className="eyebrow">SEARCH</p><h2>Workspace search</h2></div>{isSearching && <LoaderCircle className="spin" size={15} />}</header>
    <div className="search-query-row"><label className="panel-input"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setResults([]); setError(null); setProgress(null); }} autoFocus placeholder="Search workspace text" /></label><div className="search-toggles" aria-label="Search options"><button className={caseSensitive ? "active" : ""} title="Match case" onClick={() => setCaseSensitive((value) => !value)}>Aa</button><button className={wholeWord ? "active" : ""} title="Match whole word" onClick={() => setWholeWord((value) => !value)}>W</button><button className={regex ? "active" : ""} title="Use regular expression" onClick={() => setRegex((value) => !value)}>.*</button></div></div>
    <div className="search-filters"><input value={include} onChange={(event) => setInclude(event.target.value)} placeholder="files to include (for example src/**)" /><input value={exclude} onChange={(event) => setExclude(event.target.value)} placeholder="files to exclude (for example *.test.ts)" /></div>
    <div className="search-results" role="region" aria-live="polite">{!rootPath && <p>Open a folder to search files.</p>}{rootPath && indexState.status === "indexing" && !query.trim() && <p>Indexing workspace…</p>}{rootPath && !query.trim() && indexState.status !== "indexing" && <p>Searches real file contents in the active workspace. Generated folders and binary files are excluded.</p>}{visibleError && <p className="search-error">{visibleError}</p>}{isSearching && <p>Searching… {progress}</p>}{!isSearching && query.trim() && !visibleError && !visibleResults.length && <p>No workspace matches found.</p>}
      {grouped.map(([relativePath, matches]) => <section className="search-result-group" key={relativePath}><header><FileCode2 size={13} /><span>{relativePath}</span><small>{matches.length}</small></header>{matches.map((result) => <button key={`${result.path}:${result.line}:${result.column}`} onClick={() => void openResult(result)} title={`${relativePath}:${result.line}:${result.column}`}><span className="search-line-number">{result.line}</span><HighlightedPreview result={result} /></button>)}</section>)}</div>
  </section>;
}
