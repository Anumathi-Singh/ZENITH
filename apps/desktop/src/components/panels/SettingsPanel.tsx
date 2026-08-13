import { ExternalLink, Palette } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { themeEntries } from "../theme/themes";
import { useUiStore } from "../ui/uiStore";

export default function SettingsPanel() {
  const { selectedThemeId, setTheme } = useTheme();
  const openSettings = useUiStore((state) => state.openSettings);
  return <section className="zenith-side-panel"><header className="panel-header"><div><p className="eyebrow">PREFERENCES</p><h2>Quick Settings</h2></div><Palette size={18} /></header><p className="setting-copy">Quickly switch the Zenith theme or open the full settings workspace.</p><div className="settings-group theme-setting"><label>Theme<select value={selectedThemeId} onChange={(event) => setTheme(event.target.value as typeof selectedThemeId)}>{themeEntries.map(([name, theme]) => <option key={name} value={name}>{theme.label}</option>)}</select></label></div><button className="secondary-action side-settings-link" onClick={() => openSettings()}><ExternalLink size={14} />Open full Settings</button></section>;
}
