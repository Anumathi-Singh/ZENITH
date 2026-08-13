import { Accessibility, Bot, CircleUserRound, Cloud, Code2, Eye, FolderCog, Keyboard, LayoutPanelTop, MonitorCog, Palette, ShieldCheck, Sparkles, TerminalSquare, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useEditorPreferences } from "../editor/editorPreferences";
import { useUiStore } from "../ui/uiStore";
import { useAppPreferences } from "./appPreferences";
import ThemeBrowser from "./ThemeBrowser";
import { useLayoutStore } from "../layout/layoutStore";
import { useGitStore } from "../panels/gitStore";

const sections = [
  ["General", MonitorCog], ["Appearance", Palette], ["Workbench", LayoutPanelTop], ["Editor", Code2],
  ["Files", FolderCog], ["Terminal", TerminalSquare], ["Source Control", Wrench], ["GitHub & Accounts", CircleUserRound],
  ["AI", Sparkles], ["Keyboard Shortcuts", Keyboard], ["Accessibility", Accessibility], ["Privacy", ShieldCheck], ["About", Eye],
] as const;

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button className="settings-toggle-row" onClick={() => onChange(!checked)} aria-pressed={checked}><span><strong>{label}</strong>{description && <small>{description}</small>}</span><i className={checked ? "on" : ""} /></button>;
}
function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="settings-select-row"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase())}</option>)}</select></label>;
}

export default function SettingsView() {
  const { fontSize, minimap, wordWrap, setFontSize, setMinimap, setWordWrap } = useEditorPreferences();
  const { settingsCategory, setSettingsCategory, closeSettings, openDialog } = useUiStore();
  const setActivePanel = useLayoutStore((state) => state.setActivePanel);
  const gitAvailable = useGitStore((state) => state.available);
  const isGitRepository = useGitStore((state) => state.isRepository);
  const preferences = useAppPreferences();
  const [installedTerminalProfiles, setInstalledTerminalProfiles] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    void window.zenithDesktop?.getTerminalProfiles().then((profiles) => {
      if (active) setInstalledTerminalProfiles(profiles.map((profile) => profile.label));
    }).catch(() => { /* The terminal surface will show the discovery error. */ });
    return () => { active = false; };
  }, []);
  const terminalProfileOptions = ["System default", ...installedTerminalProfiles];
  if (preferences.defaultTerminalProfile && !terminalProfileOptions.includes(preferences.defaultTerminalProfile)) terminalProfileOptions.push(preferences.defaultTerminalProfile);
  const close = () => closeSettings();
  let content: React.ReactNode;
  switch (settingsCategory) {
    case "Appearance": content = <><ThemeBrowser /><div className="appearance-options"><Toggle label="Panel transparency" description="Use a restrained translucent finish on supported surfaces." checked={preferences.panelTransparency} onChange={(value) => preferences.setPreference("panelTransparency", value)} /><Toggle label="Interface animations" description="Use short transitions for menus, surfaces, and theme changes." checked={preferences.animations} onChange={(value) => preferences.setPreference("animations", value)} /><Toggle label="Reduce motion" description="Disable non-essential motion across the interface." checked={preferences.reducedMotion} onChange={(value) => preferences.setPreference("reducedMotion", value)} /></div></> ; break;
    case "Workbench": content = <><p className="settings-lead">Tune the desktop workbench without changing Zenith’s layout architecture.</p><SelectRow label="Interface density" value={preferences.density} options={["comfortable", "compact"]} onChange={(value) => preferences.setPreference("density", value as typeof preferences.density)} /><Toggle label="Panel borders" description="Keep visible boundaries between workspace surfaces." checked={preferences.panelBorders} onChange={(value) => preferences.setPreference("panelBorders", value)} /></>; break;
    case "Editor": content = <><p className="settings-lead">These settings are applied directly to the existing Monaco editor.</p><label className="settings-range-row"><span>Font size <b>{fontSize}px</b></span><input type="range" min="11" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label><Toggle label="Minimap" description="Show a compact overview of the active file." checked={minimap} onChange={setMinimap} /><Toggle label="Word wrap" description="Wrap long lines instead of scrolling sideways." checked={wordWrap} onChange={setWordWrap} /></>; break;
    case "Terminal": content = <><p className="settings-lead">Zenith discovers terminal profiles installed on this computer.</p><SelectRow label="Default terminal profile" value={preferences.defaultTerminalProfile || "System default"} options={terminalProfileOptions} onChange={(value) => preferences.setPreference("defaultTerminalProfile", value === "System default" ? "" : value)} /><Toggle label="Copy on selection" description="Copy selected terminal text when the terminal supports it." checked={preferences.copyOnSelection} onChange={(value) => preferences.setPreference("copyOnSelection", value)} /></>; break;
    case "AI": content = <><p className="settings-lead">Zenith AI remains a local interface until a model service is connected.</p><Toggle label="Show Zenith AI at startup" description="Open the independent right AI panel when Zenith starts." checked={preferences.showAiOnStartup} onChange={(value) => preferences.setPreference("showAiOnStartup", value)} /><SelectRow label="Default AI teammate" value={preferences.defaultAgent} options={["Planner", "Coder", "Reviewer", "Tester", "Docs"]} onChange={(value) => preferences.setPreference("defaultAgent", value as typeof preferences.defaultAgent)} /></>; break;
    case "GitHub & Accounts": content = <><p className="settings-lead">These connection surfaces are ready; authentication services remain intentionally disconnected.</p><button className="settings-action" onClick={() => openDialog("auth", "signin")}><CircleUserRound size={17} />Sign in to Zenith <small>Not connected</small></button><button className="settings-action" onClick={() => openDialog("github")}><Cloud size={17} />Connect GitHub <small>Not connected</small></button></>; break;
    case "Source Control": content = <><p className="settings-lead">Native Git operations run locally through Zenith’s secure desktop service.</p><button className="settings-action" onClick={() => { closeSettings(); setActivePanel("git"); }}><Wrench size={17} />Open Source Control <small>{gitAvailable === false ? "Git unavailable" : isGitRepository ? "Repository detected" : "Ready"}</small></button></>; break;
    case "Keyboard Shortcuts": content = <><p className="settings-lead">Browse the core local commands available in Zenith.</p><button className="settings-action" onClick={() => openDialog("shortcuts")}><Keyboard size={17} />Open Keyboard Shortcuts</button></>; break;
    case "Accessibility": content = <><p className="settings-lead">Keep every surface readable and comfortable.</p><Toggle label="Reduce motion" description="Remove non-essential animation." checked={preferences.reducedMotion} onChange={(value) => preferences.setPreference("reducedMotion", value)} /><SelectRow label="Interface density" value={preferences.density} options={["comfortable", "compact"]} onChange={(value) => preferences.setPreference("density", value as typeof preferences.density)} /></>; break;
    case "Privacy": content = <><p className="settings-lead">These preferences remain local to this desktop app.</p><Toggle label="Anonymous diagnostics" description="Allow diagnostics when a service is connected." checked={preferences.anonymousDiagnostics} onChange={(value) => preferences.setPreference("anonymousDiagnostics", value)} /><Toggle label="Crash reports" description="Allow crash reports when a service is connected." checked={preferences.crashReports} onChange={(value) => preferences.setPreference("crashReports", value)} /></>; break;
    case "Files": content = <><p className="settings-lead">Workspace files remain on your computer and save only when requested.</p><Toggle label="Confirm before closing unsaved files" description="Warn before closing a dirty editor tab." checked={preferences.confirmBeforeClosingDirtyFiles} onChange={(value) => preferences.setPreference("confirmBeforeClosingDirtyFiles", value)} /></>; break;
    case "About": content = <><div className="about-card"><Bot size={28} /><div><strong>Zenith Desktop</strong><small>Code · Create · Elevate</small><small>Multi-surface theme milestone</small></div></div></>; break;
    default: content = <><p className="settings-lead">Choose how Zenith opens and restores your local workspace.</p><SelectRow label="Startup behavior" value={preferences.startBehavior} options={["restore", "welcome"]} onChange={(value) => preferences.setPreference("startBehavior", value as typeof preferences.startBehavior)} /></>;
  }
  return <section className="settings-view" aria-label="Zenith Settings"><aside className="settings-navigation"><header><div><p>ZENITH</p><h2>Settings</h2></div><button title="Close Settings" onClick={close}>×</button></header><nav>{sections.map(([name, Icon]) => <button key={name} className={settingsCategory === name ? "active" : ""} onClick={() => setSettingsCategory(name)}><Icon size={16} />{name}</button>)}</nav></aside><div className="settings-main"><header><div><p>Preferences</p><h1>{settingsCategory}</h1></div></header><div className="settings-content">{content}</div></div></section>;
}
