import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as Xterm } from "@xterm/xterm";
import { Check, ChevronDown, ChevronUp, Copy, Maximize2, Minimize2, Plus, TerminalSquare, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ZenithTerminalProfile, ZenithTerminalSession } from "../../types/zenith-desktop";
import { useDismissableLayer } from "../ui/useDismissableLayer";
import { useTheme } from "../theme/useTheme";
import { useAppPreferences } from "../settings/appPreferences";

type Session = ZenithTerminalSession & { exited?: boolean };
type TerminalView = { terminal: Xterm; fit: FitAddon; observer: ResizeObserver };

interface TerminalProps {
  height: number;
  collapsed: boolean;
  maximized: boolean;
  onToggleCollapsed: () => void;
  onToggleMaximized: () => void;
}

export default function Terminal({ height, collapsed, maximized, onToggleCollapsed, onToggleMaximized }: TerminalProps) {
  const { theme } = useTheme();
  const defaultTerminalProfile = useAppPreferences((state) => state.defaultTerminalProfile);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<ZenithTerminalProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const hosts = useRef(new Map<string, HTMLDivElement>());
  const views = useRef(new Map<string, TerminalView>());
  const sessionsRef = useRef<Session[]>([]);
  const startedInitialSession = useRef(false);
  const profileMenuRef = useDismissableLayer<HTMLDivElement>(profileMenuOpen, () => setProfileMenuOpen(false));

  const xtermTheme = useMemo(() => {
    const palette = theme.terminal.emulator;
    return { background: palette.background, foreground: palette.foreground, cursor: palette.cursor, selectionBackground: palette.selection, black: palette.black, red: palette.red, green: palette.green, yellow: palette.yellow, blue: palette.blue, magenta: palette.magenta, cyan: palette.cyan, white: palette.white, brightBlack: palette.brightBlack, brightRed: palette.brightRed, brightGreen: palette.brightGreen, brightYellow: palette.brightYellow, brightBlue: palette.brightBlue, brightMagenta: palette.brightMagenta, brightCyan: palette.brightCyan, brightWhite: palette.brightWhite };
  }, [theme]);

  const fitSession = useCallback((id: string) => {
    const view = views.current.get(id);
    if (!view || !window.zenithDesktop) return;
    try {
      view.fit.fit();
      void window.zenithDesktop.terminalResize(id, view.terminal.cols, view.terminal.rows);
    } catch {
      // The inactive session can be hidden briefly while the layout transitions.
    }
  }, []);

  const attachTerminal = useCallback((session: Session) => {
    const host = hosts.current.get(session.id);
    if (!host || views.current.has(session.id) || !window.zenithDesktop) return;
    const terminal = new Xterm({
      cursorBlink: true,
      fontFamily: "Cascadia Code, JetBrains Mono, Consolas, monospace",
      fontSize: 13,
      theme: xtermTheme,
      convertEol: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(host);
    terminal.onData((data) => {
      void window.zenithDesktop?.terminalInput(session.id, data).catch((reason: unknown) => terminal.write(`\r\nTerminal input error: ${String(reason)}\r\n`));
    });
    const observer = new ResizeObserver(() => fitSession(session.id));
    observer.observe(host);
    views.current.set(session.id, { terminal, fit, observer });
    terminal.writeln(`Zenith terminal · ${session.profileLabel}`);
    terminal.writeln(`Working directory: ${session.cwd}`);
    fitSession(session.id);
    void window.zenithDesktop.terminalInput(session.id, "\r");
    terminal.focus();
  }, [fitSession, xtermTheme]);

  const createSession = useCallback(async (profileId?: string) => {
    if (!window.zenithDesktop) { setError("Terminal requires the Zenith Desktop application."); return; }
    try {
      setError("");
      const session = await window.zenithDesktop.createTerminal(profileId || selectedProfileId || undefined);
      sessionsRef.current = [...sessionsRef.current, session];
      setSessions([...sessionsRef.current]);
      setActiveId(session.id);
      setSelectedProfileId(session.profileId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start a shell.");
    }
  }, [selectedProfileId]);

  const closeSession = useCallback(async (id: string) => {
    const view = views.current.get(id);
    if (view) { view.observer.disconnect(); view.terminal.dispose(); views.current.delete(id); }
    await window.zenithDesktop?.killTerminal(id);
    sessionsRef.current = sessionsRef.current.filter((session) => session.id !== id);
    setSessions([...sessionsRef.current]);
    setActiveId((current) => current === id ? sessionsRef.current.at(-1)?.id ?? null : current);
  }, []);

  useEffect(() => {
    const removeData = window.zenithDesktop?.onTerminalData(({ id, data }) => views.current.get(id)?.terminal.write(data));
    const removeExit = window.zenithDesktop?.onTerminalExit(({ id, exitCode }) => {
      const view = views.current.get(id);
      view?.terminal.writeln(`\r\nShell exited with code ${exitCode}.`);
      sessionsRef.current = sessionsRef.current.map((session) => session.id === id ? { ...session, exited: true } : session);
      setSessions([...sessionsRef.current]);
    });
    return () => { removeData?.(); removeExit?.(); };
  }, []);

  useEffect(() => {
    const loadProfilesAndStart = async () => {
      if (!window.zenithDesktop) return;
      try {
        const availableProfiles = await window.zenithDesktop.getTerminalProfiles();
        setProfiles(availableProfiles);
        const preferredProfile = availableProfiles.find((profile) => profile.id === defaultTerminalProfile || profile.label === defaultTerminalProfile) ?? availableProfiles[0];
        if (preferredProfile) setSelectedProfileId(preferredProfile.id);
        if (!startedInitialSession.current) {
          startedInitialSession.current = true;
          await createSession(preferredProfile?.id);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not discover terminal profiles.");
      }
    };
    void loadProfilesAndStart();
  }, [createSession, defaultTerminalProfile]);

  useEffect(() => {
    const create = () => { void createSession(); };
    const clear = () => { if (activeId) views.current.get(activeId)?.terminal.clear(); };
    const kill = () => { if (activeId) void closeSession(activeId); };
    window.addEventListener("zenith:terminal-new", create);
    window.addEventListener("zenith:terminal-clear", clear);
    window.addEventListener("zenith:terminal-kill-active", kill);
    return () => { window.removeEventListener("zenith:terminal-new", create); window.removeEventListener("zenith:terminal-clear", clear); window.removeEventListener("zenith:terminal-kill-active", kill); };
  }, [activeId, closeSession, createSession]);

  useEffect(() => { sessions.forEach(attachTerminal); }, [sessions, attachTerminal]);
  useEffect(() => {
    views.current.forEach((view) => { view.terminal.options.theme = xtermTheme; });
  }, [xtermTheme]);
  useEffect(() => {
    if (activeId && !collapsed) requestAnimationFrame(() => {
      fitSession(activeId);
      views.current.get(activeId)?.terminal.focus();
    });
  }, [activeId, collapsed, fitSession, height, maximized]);
  useEffect(() => () => {
    sessionsRef.current.forEach((session) => { void window.zenithDesktop?.killTerminal(session.id); });
    views.current.forEach((view) => { view.observer.disconnect(); view.terminal.dispose(); });
  }, []);

  const activeSession = sessions.find((session) => session.id === activeId);
  const selectedProfile = profiles.find((profile) => profile.id === (activeSession?.profileId || selectedProfileId));
  const copyOutput = async () => {
    const terminal = activeId ? views.current.get(activeId)?.terminal : undefined;
    if (!terminal || !navigator.clipboard) return;
    const buffer = terminal.buffer.active;
    const output = Array.from({ length: buffer.length }, (_, index) => buffer.getLine(index)?.translateToString(true) ?? "").join("\n").trimEnd();
    await navigator.clipboard.writeText(output);
  };

  const terminalStyle = maximized ? undefined : { height: collapsed ? 44 : height };

  return (
    <section className={`terminal-panel ${collapsed ? "is-collapsed" : ""} ${maximized ? "is-maximized" : ""}`} style={terminalStyle}>
      <header className="terminal-header">
        <button className="terminal-title" title={collapsed ? "Expand terminal" : "Collapse terminal"} onClick={onToggleCollapsed}><TerminalSquare size={17} /><strong>Terminal</strong>{collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
        {!collapsed && <div className="terminal-session-tabs" role="tablist">{sessions.map((session, index) => <button key={session.id} className={session.id === activeId ? "active" : ""} role="tab" aria-selected={session.id === activeId} onClick={() => setActiveId(session.id)}>Terminal {index + 1}<small>{session.profileLabel}</small>{session.exited && <span>ended</span>}</button>)}</div>}
        <div className="terminal-actions">
          {!collapsed && <button title="New terminal" onClick={() => void createSession()}><Plus size={16} /></button>}
          {!collapsed && <div className="terminal-profile-anchor" ref={profileMenuRef}><button className="shell-select" title="Choose a terminal profile" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((value) => !value)}><span className="online-dot" />{selectedProfile?.label ?? "Shell"}<ChevronDown size={13} /></button>{profileMenuOpen && <div className="zenith-popover terminal-profile-menu" role="menu">{profiles.map((profile) => <button key={profile.id} className={profile.id === selectedProfile?.id ? "selected" : ""} role="menuitem" onClick={() => { setProfileMenuOpen(false); setSelectedProfileId(profile.id); void createSession(profile.id); }}><span>{profile.label}</span><small>{profile.shell}</small>{profile.id === selectedProfile?.id && <Check size={14} />}</button>)}{!profiles.length && <p>No supported shell found.</p>}</div>}</div>}
          {!collapsed && <button title="Copy terminal output" onClick={() => void copyOutput()} disabled={!activeId}><Copy size={16} /></button>}
          {!collapsed && <button title="Clear terminal" onClick={() => activeId && views.current.get(activeId)?.terminal.clear()} disabled={!activeId}><Trash2 size={16} /></button>}
          <button title={maximized ? "Restore terminal" : "Maximize terminal"} onClick={onToggleMaximized}>{maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
          {!collapsed && <button title="Close active terminal" disabled={!activeId} onClick={() => activeId && void closeSession(activeId)}><X size={17} /></button>}
        </div>
      </header>
      {!collapsed && <div className="terminal-body zenith-terminal-body">{sessions.map((session) => <div key={session.id} ref={(element) => { if (element) hosts.current.set(session.id, element); else hosts.current.delete(session.id); }} className={`zenith-terminal-host ${session.id === activeId ? "active" : ""}`} />)}{!sessions.length && !error && <button className="terminal-start" onClick={() => void createSession()}>Start a terminal</button>}{error && <p className="terminal-error">{error}</p>}</div>}
    </section>
  );
}



