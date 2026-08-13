import { useMemo, useState, type CSSProperties } from "react";
import { Check, Moon, Search, Sun } from "lucide-react";
import { themeEntries, themeRegistry, type ThemeCategory, type ThemeName, type ZenithTheme } from "../theme/themes";
import { useTheme } from "../theme/useTheme";

const filters = ["All", "Light", "Dark", "Mixed", "Pastel", "Celestial", "Nature", "Gothic", "Neon"] as const;
const lightThemes = themeEntries.filter(([, theme]) => theme.appearanceMode === "light");
const darkThemes = themeEntries.filter(([, theme]) => theme.appearanceMode === "dark");

function MiniIdePreview({ theme }: { theme: ZenithTheme }) {
  const style = (background: string): CSSProperties => ({ background });
  return <div className="theme-miniature" style={style(theme.background.composition)} aria-hidden="true"><i className="mini-topbar" style={style(theme.topbar.background)} /><i className="mini-activity" style={style(theme.activity.background)} /><i className="mini-sidebar" style={style(theme.sidebar.background)} /><i className="mini-editor" style={style(theme.monaco.background)} /><i className="mini-ai" style={style(theme.ai.background)} /><i className="mini-terminal" style={style(theme.terminal.frameBackground)} /><b style={style(theme.accent.primary)} /></div>;
}

export default function ThemeBrowser() {
  const { selectedThemeId, setTheme, preferredLightThemeId, preferredDarkThemeId, setPreferredLightTheme, setPreferredDarkTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const matches = useMemo(() => themeEntries.filter(([, theme]) => {
    const categoryMatches = filter === "All" || theme.tags.includes(filter as ThemeCategory);
    return categoryMatches && `${theme.label} ${theme.description} ${theme.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [filter, query]);
  const selected = themeRegistry[selectedThemeId];

  return <div className="theme-browser">
    <div className="theme-browser-toolbar"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search themes" /></label><div className="theme-filters">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    <div className="theme-browser-layout">
      <div className="theme-gallery">{matches.map(([name, theme]) => <button key={name} className={`theme-preview-card ${selectedThemeId === name ? "selected applied" : ""}`} onClick={() => setTheme(name)}><MiniIdePreview theme={theme} /><span><strong>{theme.label}</strong><small>{theme.appearanceMode} · {theme.tags.slice(0, 2).join(" · ")}</small></span>{selectedThemeId === name && <Check size={15} />}</button>)}{!matches.length && <p className="theme-empty">No themes match that search.</p>}</div>
      <aside className="theme-detail"><MiniIdePreview theme={selected} /><p className="theme-detail-eyebrow">{selected.appearanceMode} composition</p><h3>{selected.label}</h3><p>{selected.description}</p><div className="theme-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="theme-swatches">{[selected.accent.primary, selected.accent.secondary, selected.accent.tertiary, selected.monaco.background, selected.terminal.frameBackground].map((color) => <i key={color} style={{ background: color }} />)}</div><p className="theme-active-note"><Check size={14} />Active theme</p></aside>
    </div>
    <section className="theme-quick-toggle" aria-labelledby="quick-toggle-heading">
      <div><p className="theme-detail-eyebrow">GLOBAL PREFERENCES</p><h3 id="quick-toggle-heading">Quick light/dark toggle</h3><p>Choose the two themes used by the top-bar appearance button. Mixed themes switch according to their editor tone.</p></div>
      <label className="settings-select-row"><span><Sun size={14} />Light theme</span><select value={preferredLightThemeId} onChange={(event) => setPreferredLightTheme(event.target.value as ThemeName)}>{lightThemes.map(([name, theme]) => <option key={name} value={name}>{theme.label}</option>)}</select></label>
      <label className="settings-select-row"><span><Moon size={14} />Dark theme</span><select value={preferredDarkThemeId} onChange={(event) => setPreferredDarkTheme(event.target.value as ThemeName)}>{darkThemes.map(([name, theme]) => <option key={name} value={name}>{theme.label}</option>)}</select></label>
    </section>
  </div>;
}
