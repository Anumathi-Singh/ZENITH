import { useMemo, useState, type CSSProperties } from "react";
import { Check, Eye, Moon, Search, Sun, X } from "lucide-react";
import { themeEntries, type ThemeCategory, type ThemeName, type ZenithTheme } from "../theme/themes";
import { useTheme } from "../theme/useTheme";

const filters = ["All", "Light", "Dark", "Mixed", "Pastel", "Celestial", "Nature", "Gothic", "Neon"] as const;

function MiniIdePreview({ theme }: { theme: ZenithTheme }) {
  const style = (background: string): CSSProperties => ({ background });
  return <div className="theme-miniature" style={style(theme.background.composition)} aria-hidden="true"><i className="mini-topbar" style={style(theme.topbar.background)} /><i className="mini-activity" style={style(theme.activity.background)} /><i className="mini-sidebar" style={style(theme.sidebar.background)} /><i className="mini-editor" style={style(theme.monaco.background)} /><i className="mini-ai" style={style(theme.ai.background)} /><i className="mini-terminal" style={style(theme.terminal.frameBackground)} /><b style={style(theme.accent.primary)} /></div>;
}

export default function ThemeBrowser() {
  const { appliedThemeName, previewThemeName, setTheme, previewTheme, clearPreview, setPreferredTheme, lightThemeName, darkThemeName } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedName, setSelectedName] = useState<ThemeName>(appliedThemeName);
  const matches = useMemo(() => themeEntries.filter(([, theme]) => {
    const categoryMatches = filter === "All" || theme.tags.includes(filter as ThemeCategory);
    return categoryMatches && `${theme.label} ${theme.description} ${theme.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [filter, query]);
  const selected = themeEntries.find(([name]) => name === selectedName)?.[1] ?? themeEntries[0][1];
  const isPreviewingSelected = previewThemeName === selectedName;
  return <div className="theme-browser"><div className="theme-browser-toolbar"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search themes" /></label><div className="theme-filters">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="theme-browser-layout"><div className="theme-gallery">{matches.map(([name, theme]) => <button key={name} className={`theme-preview-card ${selectedName === name ? "selected" : ""} ${appliedThemeName === name ? "applied" : ""}`} onClick={() => setSelectedName(name)}><MiniIdePreview theme={theme} /><span><strong>{theme.label}</strong><small>{theme.appearanceMode} · {theme.tags.slice(0, 2).join(" · ")}</small></span>{appliedThemeName === name && <Check size={15} />}</button>)}{!matches.length && <p className="theme-empty">No themes match that search.</p>}</div><aside className="theme-detail"><MiniIdePreview theme={selected} /><p className="theme-detail-eyebrow">{selected.appearanceMode} composition</p><h3>{selected.label}</h3><p>{selected.description}</p><div className="theme-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="theme-swatches">{[selected.accent.primary, selected.accent.secondary, selected.accent.tertiary, selected.monaco.background, selected.terminal.frameBackground].map((color) => <i key={color} style={{ background: color }} />)}</div><div className="theme-detail-actions"><button className="theme-apply" onClick={() => setTheme(selectedName)}><Check size={15} />Apply</button><button onClick={() => isPreviewingSelected ? clearPreview() : previewTheme(selectedName)}>{isPreviewingSelected ? <X size={15} /> : <Eye size={15} />}{isPreviewingSelected ? "Cancel preview" : "Preview"}</button></div><div className="theme-preferences">{selected.appearanceMode !== "dark" && <button className={lightThemeName === selectedName ? "active" : ""} onClick={() => setPreferredTheme("light", selectedName)}><Sun size={14} />Light preference</button>}{selected.appearanceMode !== "light" && <button className={darkThemeName === selectedName ? "active" : ""} onClick={() => setPreferredTheme("dark", selectedName)}><Moon size={14} />Dark preference</button>}</div></aside></div></div>;
}
