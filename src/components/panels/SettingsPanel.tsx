import { Eye, Moon, Palette, Sun, Type } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { useEditorPreferences } from "../editor/editorPreferences";

export default function SettingsPanel() {
  const { themeName, setTheme } = useTheme();
  const { fontSize, minimap, wordWrap, setFontSize, toggleMinimap, toggleWordWrap } = useEditorPreferences();
  return <section className="zenith-side-panel"><header className="panel-header"><div><p className="eyebrow">SETTINGS</p><h2>Appearance</h2></div><Palette size={19} /></header><p className="setting-copy">Tune Zenith to fit the way you work.</p><div className="theme-options"><button className={themeName === "light" ? "selected" : ""} onClick={() => setTheme("light")}><Sun size={18} />Light <span /></button><button className={themeName === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}><Moon size={18} />Midnight <span /></button></div><div className="settings-group"><label><Type size={15} /> Editor font size <b>{fontSize}px</b></label><input type="range" min="12" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><button className="setting-toggle" onClick={toggleMinimap}><Eye size={16} /> Show minimap <span className={minimap ? "on" : ""} /></button><button className="setting-toggle" onClick={toggleWordWrap}>↪ Word wrap <span className={wordWrap ? "on" : ""} /></button></div></section>;
}
