import { useMemo } from "react";
import { Accessibility, Bot, Check, CircleUserRound, Cloud, Code2, Eye, FolderCog, Keyboard, LayoutPanelTop, MonitorCog, Palette, ShieldCheck, Sparkles, TerminalSquare, Wrench } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { themeEntries, type ThemeName } from "../theme/themes";
import { useEditorPreferences } from "../editor/editorPreferences";
import { useUiStore } from "../ui/uiStore";
import { useAppPreferences } from "./appPreferences";

const sections = [
  ["General", MonitorCog], ["Appearance", Palette], ["Workbench", LayoutPanelTop], ["Editor", Code2],
  ["Files", FolderCog], ["Terminal", TerminalSquare], ["Source Control", Wrench], ["GitHub & Accounts", CircleUserRound],
  ["AI", Sparkles], ["Keyboard Shortcuts", Keyboard], ["Accessibility", Accessibility], ["Privacy", ShieldCheck], ["About", Eye],
] as const;

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button className="settings-toggle-row" onClick={() => onChange(!checked)} aria-pressed={checked}><span><strong>{label}</strong>{description && <small>{description}</small>}</span><i className={checked ? "on" : ""} /></button>;
}
function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="settings-select-row"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

export default function SettingsView() {
  const { themeName, setTheme } = useTheme();
  const { fontSize, minimap, wordWrap, setFontSize, setMinimap, setWordWrap } = useEditorPreferences();
  const { settingsCategory, setSettingsCategory, closeSettings, openDialog } = useUiStore();
  const preferences = useAppPreferences();
  const content = useMemo(() => {
    switch (settingsCategory) {
      case "Appearance": return <>
        <p className="settings-lead">Choose a Zenith color system. Changes apply to the full desktop surface, Monaco, and terminal.</p>
        <div className="theme-card-grid">{themeEntries.map(([name, theme]) => <button key={name} className={`theme-card ${themeName === name ? "selected" : ""}`} onClick={() => setTheme(name as ThemeName)}><span style={{ background: `linear-gradient(135deg, ${theme.background}, ${theme.accent})` }} /> <strong>{theme.label}</strong>{themeName === name && <Check size={15} />}</button>)}</div>
        <Toggle label="Panel borders" description="Show the subtle outlines around Zenith surfaces." checked={preferences.panelBorders} onChange={(value) => preferences.setPreference("panelBorders", value)} />
        <Toggle label="Interface animations" description="Keep soft transitions between Zenit’s panels and menus." checked={preferences.animations} onChange={(value) => preferences.setPreference("animations", value)} />
      </>;
      case "Editor": return <>
        <p className="settings-lead">These are saved on this device and are applied to the existing Monaco editor.</p>
        <label className="settings-range-row"><span>Font size <b>{fontSize}px</b></span><input type="range" min="11" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
        <Toggle label="Minimap" description="Show a compact overview of the active file." checked={minimap} onChange={setMinimap} />
        <Toggle label="Word wrap" description="Wrap long lines instead of scrolling sideways." checked={wordWrap} onChange={setWordWrap} />
      </>;
      case "Workbench": return <><p className="settings-lead">Tune the local desktop workbench without changing the underlying layout architecture.</p><SelectRow label="Interface density" value={preferences.density} options={["comfortable", "compact"]} onChange={(value) => preferences.setPreference("density", value as typeof preferences.density)} /><Toggle label="Panel borders" description="Keep the soft boundaries around workspace surfaces." checked={preferences.panelBorders} onChange={(value) => preferences.setPreference("panelBorders", value)} /></>;
      case "Terminal": return <><p className="settings-lead">Zenith uses the terminal profiles installed on this computer.</p><SelectRow label="Default terminal profile" value={preferences.defaultTerminalProfile || "System default"} options={["System default", "PowerShell", "Command Prompt", "Git Bash", "WSL"]} onChange={(value) => preferences.setPreference("defaultTerminalProfile", value === "System default" ? "" : value)} /><Toggle label="Copy on selection" description="Copy selected terminal text when supported by the terminal." checked={preferences.copyOnSelection} onChange={(value) => preferences.setPreference("copyOnSelection", value)} /></>;
      case "Source Control": return <><p className="settings-lead">Git status and repository commands appear when Zenith’s local Git service is connected.</p><button className="settings-action" onClick={() => openDialog("repository", "initialize")}><Wrench size={17} />Initialize a repository <small>Not connected</small></button><button className="settings-action" onClick={() => openDialog("github")}><Cloud size={17} />Connect GitHub <small>Not connected</small></button></>;
      case "AI": return <><p className="settings-lead">Zenith AI is ready as a local workspace surface. Model connections can be added later.</p><Toggle label="Show Zenith AI at startup" description="Open the AI panel when the desktop starts." checked={preferences.showAiOnStartup} onChange={(value) => preferences.setPreference("showAiOnStartup", value)} /><SelectRow label="Default AI teammate" value={preferences.defaultAgent} options={["Planner", "Coder", "Reviewer", "Tester", "Docs"]} onChange={(value) => preferences.setPreference("defaultAgent", value as typeof preferences.defaultAgent)} /></>;
      case "GitHub & Accounts": return <><p className="settings-lead">Account and GitHub controls are ready. Connecting requires the future authentication service.</p><button className="settings-action" onClick={() => openDialog("auth", "signin")}><CircleUserRound size={17} />Sign in to Zenith <small>Not connected</small></button><button className="settings-action" onClick={() => openDialog("github")}><Cloud size={17} />Connect GitHub <small>Not connected</small></button></>;
      case "Keyboard Shortcuts": return <><p className="settings-lead">A practical local command list for the current Zenith workspace.</p><button className="settings-action" onClick={() => openDialog("shortcuts")}><Keyboard size={17} />Open Keyboard Shortcuts</button></>;
      case "Accessibility": return <><p className="settings-lead">Make the interface more comfortable without changing your project.</p><Toggle label="Reduce motion" description="Remove non-essential animation from Zenith." checked={preferences.reducedMotion} onChange={(value) => preferences.setPreference("reducedMotion", value)} /><SelectRow label="Interface density" value={preferences.density} options={["comfortable", "compact"]} onChange={(value) => preferences.setPreference("density", value as typeof preferences.density)} /></>;
      case "Privacy": return <><p className="settings-lead">These controls remain local to this desktop app.</p><Toggle label="Anonymous diagnostics" description="Allow anonymous product diagnostics when a service is connected." checked={preferences.anonymousDiagnostics} onChange={(value) => preferences.setPreference("anonymousDiagnostics", value)} /><Toggle label="Crash reports" description="Allow crash reports when a service is connected." checked={preferences.crashReports} onChange={(value) => preferences.setPreference("crashReports", value)} /></>;
      case "About": return <><p className="settings-lead">Zenith is your calm local development workspace.</p><div className="about-card"><Bot size={28} /><div><strong>Zenith Desktop</strong><small>Code · Create · Elevate</small><small>UI completeness preview</small></div></div></>;
      case "Files": return <><p className="settings-lead">Your selected workspace stays on your computer. File changes only save when you explicitly save them.</p><Toggle label="Confirm before closing unsaved files" description="Keep a warning for tabs with changes." checked={preferences.confirmBeforeClosingDirtyFiles} onChange={(value) => preferences.setPreference("confirmBeforeClosingDirtyFiles", value)} /></>;
      default: return <><p className="settings-lead">Workspace preferences for how Zenith opens and behaves on this device.</p><SelectRow label="Startup behavior" value={preferences.startBehavior} options={["restore", "welcome"]} onChange={(value) => preferences.setPreference("startBehavior", value as typeof preferences.startBehavior)} /><Toggle label="Restore AI panel at startup" description="Keep the AI panel visible when Zenith opens." checked={preferences.showAiOnStartup} onChange={(value) => preferences.setPreference("showAiOnStartup", value)} /></>;
    }
  }, [fontSize, minimap, openDialog, preferences, setFontSize, setMinimap, setTheme, setWordWrap, settingsCategory, themeName, wordWrap]);

  return <section className="settings-view" aria-label="Zenith Settings"><aside className="settings-navigation"><header><div><p>ZENITH</p><h2>Settings</h2></div><button title="Close Settings" onClick={closeSettings}>×</button></header><nav>{sections.map(([name, Icon]) => <button key={name} className={settingsCategory === name ? "active" : ""} onClick={() => setSettingsCategory(name)}><Icon size={16} />{name}</button>)}</nav></aside><div className="settings-main"><header><p>Preferences</p><h1>{settingsCategory}</h1></header><div className="settings-content">{content}</div></div></section>;
}

