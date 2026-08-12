export type AppearanceMode = "light" | "dark" | "mixed";
export type ThemeCategory = "Light" | "Dark" | "Mixed" | "Pastel" | "Celestial" | "Nature" | "Gothic" | "Neon" | "Minimal";
export type DecorationStyle = "none" | "celestial" | "botanical" | "punk" | "vinyl" | "butterfly" | "floral-night" | "rose-geometry" | "sakura" | "aurora" | "sunset";

export interface ThemeBackground {
  composition: string;
  pattern: string;
  patternSize: string;
  patternOpacity: string;
  vignette: string;
}

export type ThemeName =
  | "light" | "dark" | "celestialDream" | "sageScrapbook" | "neonRebel"
  | "crimsonVinyl" | "scarletButterfly" | "emeraldNocturne" | "roseCelestial"
  | "moonlight" | "midnight" | "sakura" | "aurora" | "forest" | "sunset";

interface TextTone { text: string; muted: string; }
interface SurfaceSeed {
  topbar: string; activity: string; sidebar: string; sidebarHeader: string;
  editorChrome: string; editorTabs: string; editorTab: string; editorTabActive: string;
  breadcrumb: string; editor: string; ai: string; aiHeader: string; aiCard: string;
  aiComposer: string; terminalFrame: string; terminalHeader: string; status: string;
  floating: string; floatingElevated: string; input: string;
}

interface ThemeSeed {
  id: ThemeName; label: string; description: string; appearanceMode: AppearanceMode;
  editorMode: "light" | "dark"; tags: ThemeCategory[];
  decoration: { style: DecorationStyle; density: "none" | "subtle" | "balanced"; color: string; secondary: string };
  base: {
    app: string; glow: string; text: string; textSecondary: string; muted: string;
    border: string; borderStrong: string; focus: string; shadow: string;
    success: string; warning: string; danger: string; info: string;
  };
  accents: { primary: string; secondary: string; tertiary: string; soft: string; hover: string; pressed: string; onAccent: string };
  surfaces: SurfaceSeed;
  tones?: Partial<Record<"topbar" | "activity" | "sidebar" | "editor" | "ai" | "terminal" | "status" | "floating", TextTone>>;
  monaco?: Partial<MonacoThemeTokens>;
  terminal?: Partial<TerminalEmulatorTokens>;
  agents?: Partial<AgentThemeTokens>;
}

export interface MonacoThemeTokens {
  mode: "light" | "dark"; background: string; foreground: string; selection: string;
  inactiveSelection: string; cursor: string; currentLine: string; lineNumber: string;
  activeLineNumber: string; indentGuide: string; activeIndentGuide: string; bracketGuide: string;
  gutter: string; minimap: string; scrollbar: string; scrollbarHover: string;
  findHighlight: string; findMatch: string; wordHighlight: string;
  syntax: { comment: string; keyword: string; string: string; number: string; type: string; function: string; variable: string; constant: string };
}

export interface TerminalEmulatorTokens {
  background: string; foreground: string; cursor: string; selection: string;
  black: string; red: string; green: string; yellow: string; blue: string; magenta: string; cyan: string; white: string;
  brightBlack: string; brightRed: string; brightGreen: string; brightYellow: string; brightBlue: string; brightMagenta: string; brightCyan: string; brightWhite: string;
}

export interface AgentThemeTokens { orchestrator: string; planner: string; coder: string; reviewer: string; tester: string; docs: string; }

export interface ZenithTheme {
  id: ThemeName; label: string; description: string; appearanceMode: AppearanceMode;
  tags: ThemeCategory[]; decoration: ThemeSeed["decoration"];
  background: ThemeBackground;
  global: { appBackground: string; backgroundGlow: string; textPrimary: string; textSecondary: string; textMuted: string; border: string; borderStrong: string; shadow: string; focusRing: string; success: string; warning: string; danger: string; info: string };
  accent: { primary: string; secondary: string; tertiary: string; soft: string; hover: string; pressed: string; onAccent: string };
  topbar: { background: string; border: string; text: string; muted: string; buttonHover: string; buttonActive: string; searchBackground: string; searchBorder: string };
  activity: { background: string; border: string; icon: string; iconMuted: string; hover: string; selected: string; selectedIcon: string; indicator: string };
  sidebar: { background: string; header: string; border: string; text: string; muted: string; hover: string; selected: string; folder: string; file: string };
  editor: { chromeBackground: string; tabsBackground: string; tabBackground: string; tabActiveBackground: string; tabText: string; tabActiveText: string; tabDirty: string; breadcrumbBackground: string; breadcrumbText: string; breadcrumbMuted: string };
  monaco: MonacoThemeTokens;
  ai: { background: string; headerBackground: string; border: string; text: string; muted: string; cardBackground: string; cardBorder: string; cardSelected: string; composerBackground: string; composerBorder: string };
  agents: AgentThemeTokens;
  terminal: { frameBackground: string; headerBackground: string; border: string; buttonHover: string; emulator: TerminalEmulatorTokens };
  status: { background: string; text: string; muted: string; border: string; accent: string; hover: string };
  floating: { overlay: string; background: string; elevated: string; border: string; shadow: string; menuHover: string; menuSelected: string; inputBackground: string; inputBorder: string; inputFocus: string; text: string; muted: string };
  git: { added: string; modified: string; deleted: string; conflict: string; warning: string; error: string; success: string };
}

const tone = (seed: ThemeSeed, key: keyof NonNullable<ThemeSeed["tones"]>): TextTone => seed.tones?.[key] ?? { text: seed.base.text, muted: seed.base.muted };

function buildTheme(seed: ThemeSeed): ZenithTheme {
  const topbar = tone(seed, "topbar"), activity = tone(seed, "activity"), sidebar = tone(seed, "sidebar");
  const editor = tone(seed, "editor"), ai = tone(seed, "ai"), terminal = tone(seed, "terminal");
  const status = tone(seed, "status"), floating = tone(seed, "floating");
  const monacoDefaults: MonacoThemeTokens = {
    mode: seed.editorMode, background: seed.surfaces.editor, foreground: editor.text,
    selection: seed.accents.soft, inactiveSelection: seed.surfaces.editorTabActive,
    cursor: seed.accents.secondary, currentLine: seed.surfaces.editorChrome,
    lineNumber: editor.muted, activeLineNumber: editor.text, indentGuide: seed.base.border,
    activeIndentGuide: seed.base.borderStrong, bracketGuide: seed.accents.tertiary,
    gutter: seed.surfaces.editor, minimap: seed.surfaces.editor, scrollbar: seed.base.borderStrong,
    scrollbarHover: seed.accents.primary, findHighlight: seed.accents.tertiary,
    findMatch: seed.accents.secondary, wordHighlight: seed.accents.soft,
    syntax: {
      comment: editor.muted, keyword: seed.accents.primary, string: seed.base.success,
      number: seed.accents.secondary, type: seed.base.info, function: seed.accents.tertiary,
      variable: editor.text, constant: seed.base.warning,
    },
  };
  const emulatorDefaults: TerminalEmulatorTokens = {
    background: seed.surfaces.terminalFrame, foreground: terminal.text,
    cursor: seed.accents.tertiary, selection: seed.accents.pressed,
    black: "#11111a", red: seed.base.danger, green: seed.base.success, yellow: seed.base.warning,
    blue: seed.base.info, magenta: seed.accents.secondary, cyan: seed.accents.tertiary, white: terminal.text,
    brightBlack: terminal.muted, brightRed: seed.base.danger, brightGreen: seed.base.success,
    brightYellow: seed.base.warning, brightBlue: seed.base.info, brightMagenta: seed.accents.secondary,
    brightCyan: seed.accents.tertiary, brightWhite: "#ffffff",
  };
  const agentDefaults: AgentThemeTokens = {
    orchestrator: seed.accents.primary, planner: seed.accents.primary, coder: seed.base.success,
    reviewer: seed.accents.secondary, tester: seed.base.info, docs: seed.accents.tertiary,
  };
  return {
    id: seed.id, label: seed.label, description: seed.description, appearanceMode: seed.appearanceMode,
    tags: seed.tags, decoration: seed.decoration, background: backgroundCompositions[seed.id],
    global: { appBackground: seed.base.app, backgroundGlow: seed.base.glow, textPrimary: seed.base.text, textSecondary: seed.base.textSecondary, textMuted: seed.base.muted, border: seed.base.border, borderStrong: seed.base.borderStrong, shadow: seed.base.shadow, focusRing: seed.base.focus, success: seed.base.success, warning: seed.base.warning, danger: seed.base.danger, info: seed.base.info },
    accent: seed.accents,
    topbar: { background: seed.surfaces.topbar, border: seed.base.border, text: topbar.text, muted: topbar.muted, buttonHover: seed.accents.soft, buttonActive: seed.accents.pressed, searchBackground: seed.surfaces.input, searchBorder: seed.base.borderStrong },
    activity: { background: seed.surfaces.activity, border: seed.base.border, icon: activity.text, iconMuted: activity.muted, hover: seed.accents.soft, selected: seed.accents.pressed, selectedIcon: seed.accents.primary, indicator: seed.accents.secondary },
    sidebar: { background: seed.surfaces.sidebar, header: seed.surfaces.sidebarHeader, border: seed.base.border, text: sidebar.text, muted: sidebar.muted, hover: seed.accents.soft, selected: seed.accents.pressed, folder: seed.accents.primary, file: sidebar.muted },
    editor: { chromeBackground: seed.surfaces.editorChrome, tabsBackground: seed.surfaces.editorTabs, tabBackground: seed.surfaces.editorTab, tabActiveBackground: seed.surfaces.editorTabActive, tabText: editor.muted, tabActiveText: editor.text, tabDirty: seed.accents.secondary, breadcrumbBackground: seed.surfaces.breadcrumb, breadcrumbText: editor.text, breadcrumbMuted: editor.muted },
    monaco: { ...monacoDefaults, ...seed.monaco, syntax: { ...monacoDefaults.syntax, ...seed.monaco?.syntax } },
    ai: { background: seed.surfaces.ai, headerBackground: seed.surfaces.aiHeader, border: seed.base.border, text: ai.text, muted: ai.muted, cardBackground: seed.surfaces.aiCard, cardBorder: seed.base.border, cardSelected: seed.accents.soft, composerBackground: seed.surfaces.aiComposer, composerBorder: seed.base.borderStrong },
    agents: { ...agentDefaults, ...seed.agents },
    terminal: { frameBackground: seed.surfaces.terminalFrame, headerBackground: seed.surfaces.terminalHeader, border: seed.base.borderStrong, buttonHover: seed.accents.pressed, emulator: { ...emulatorDefaults, ...seed.terminal } },
    status: { background: seed.surfaces.status, text: status.text, muted: status.muted, border: seed.base.border, accent: seed.accents.primary, hover: seed.accents.soft },
    floating: { overlay: seed.editorMode === "dark" ? "#09081299" : "#29213f33", background: seed.surfaces.floating, elevated: seed.surfaces.floatingElevated, border: seed.base.borderStrong, shadow: seed.base.shadow, menuHover: seed.accents.soft, menuSelected: seed.accents.pressed, inputBackground: seed.surfaces.input, inputBorder: seed.base.border, inputFocus: seed.base.focus, text: floating.text, muted: floating.muted },
    git: { added: seed.base.success, modified: seed.base.warning, deleted: seed.base.danger, conflict: seed.accents.secondary, warning: seed.base.warning, error: seed.base.danger, success: seed.base.success },
  };
}

const surface = (values: Partial<SurfaceSeed> & Pick<SurfaceSeed, "topbar" | "activity" | "sidebar" | "editor" | "ai" | "terminalFrame" | "status">): SurfaceSeed => ({
  sidebarHeader: values.sidebar, editorChrome: values.editor, editorTabs: values.editor, editorTab: values.editor,
  editorTabActive: values.editor, breadcrumb: values.editor, aiHeader: values.ai, aiCard: values.ai,
  aiComposer: values.ai, terminalHeader: values.terminalFrame, floating: values.editor,
  floatingElevated: values.editor, input: values.editor, ...values,
});

const seeds: ThemeSeed[] = [
  { id: "light", label: "Zenith Light", description: "Pearl surfaces with lavender, blush, and peach accents.", appearanceMode: "light", editorMode: "light", tags: ["Light", "Pastel", "Minimal"], decoration: { style: "celestial", density: "subtle", color: "#cdb4ff", secondary: "#ffd6a5" }, base: { app: "#f8f7ff", glow: "#f1e8ff", text: "#27213f", textSecondary: "#5f5874", muted: "#9088a3", border: "#e8e0f2", borderStrong: "#d7cbea", focus: "#8769df", shadow: "0 18px 48px #493b7218", success: "#4d966f", warning: "#b07a38", danger: "#ca587b", info: "#577fc5" }, accents: { primary: "#8769df", secondary: "#e783b9", tertiary: "#eda66f", soft: "#f0e9ff", hover: "#7558c9", pressed: "#e3d7ff", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#fffdfd", activity: "#f5efff", sidebar: "#fbf8ff", sidebarHeader: "#f5efff", editor: "#fffefd", editorChrome: "#faf7ff", editorTabs: "#f6f1fc", editorTab: "#f6f1fc", editorTabActive: "#fffefd", breadcrumb: "#fcf9ff", ai: "#fff6fb", aiHeader: "#fff1f8", aiCard: "#fffafd", aiComposer: "#fff0f7", terminalFrame: "#1d1934", terminalHeader: "#25203e", status: "#f0ebfa", floating: "#fffdfd", floatingElevated: "#ffffff", input: "#f8f4ff" }), tones: { terminal: { text: "#eeeaff", muted: "#afa6c9" } } },
  { id: "dark", label: "Zenith Dark", description: "Midnight navy, violet, cyan, and muted rose.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Celestial"], decoration: { style: "celestial", density: "subtle", color: "#b49aff", secondary: "#72d8e2" }, base: { app: "#11111c", glow: "#28234a", text: "#f1edff", textSecondary: "#c8c0dc", muted: "#978fac", border: "#37324c", borderStrong: "#4f4868", focus: "#b49aff", shadow: "0 22px 58px #05040c66", success: "#79c99b", warning: "#e4bb72", danger: "#f08ca8", info: "#79b8ef" }, accents: { primary: "#b49aff", secondary: "#efa1cc", tertiary: "#75d5df", soft: "#393050", hover: "#cfbcff", pressed: "#4b3e70", onAccent: "#171321" }, surfaces: surface({ topbar: "#191725", activity: "#181626", sidebar: "#201d30", sidebarHeader: "#26223a", editor: "#181725", editorChrome: "#211e31", editorTabs: "#1e1b2c", editorTab: "#1e1b2c", editorTabActive: "#181725", breadcrumb: "#1c1a2a", ai: "#241d31", aiHeader: "#2b223a", aiCard: "#2c263d", aiComposer: "#30233b", terminalFrame: "#0d0d17", terminalHeader: "#151321", status: "#1a1729", floating: "#242136", floatingElevated: "#2a263e", input: "#1b1929" }) },
  { id: "celestialDream", label: "Celestial Dream", description: "Lavender dusk, pearl clouds, soft pink light, and cosmic violet.", appearanceMode: "mixed", editorMode: "light", tags: ["Mixed", "Pastel", "Celestial"], decoration: { style: "celestial", density: "balanced", color: "#aa8cff", secondary: "#f2a9d2" }, base: { app: "#ddd4ff", glow: "#ffcfe8", text: "#292244", textSecondary: "#625b7d", muted: "#9188aa", border: "#d8ccef", borderStrong: "#bca9e2", focus: "#8064dc", shadow: "0 22px 58px #4f39742b", success: "#55977e", warning: "#b88442", danger: "#c95d82", info: "#5b7fcc" }, accents: { primary: "#8b70e3", secondary: "#e88dbf", tertiary: "#e6b56e", soft: "#eee7ff", hover: "#7054ca", pressed: "#dcd0ff", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#cfc1f3", activity: "#e9e1ff", sidebar: "#f7f1ff", sidebarHeader: "#e9ddfb", editor: "#fffaff", editorChrome: "#f4edff", editorTabs: "#eee5fa", editorTab: "#eee5fa", editorTabActive: "#fffaff", breadcrumb: "#f9f3ff", ai: "#f4dff2", aiHeader: "#e9ceef", aiCard: "#faedf8", aiComposer: "#f7e6f4", terminalFrame: "#241d43", terminalHeader: "#302650", status: "#d6c7ef", floating: "#fff8ff", floatingElevated: "#ffffff", input: "#f3ebff" }), tones: { terminal: { text: "#f5efff", muted: "#b9aed7" } } },
  { id: "sageScrapbook", label: "Sage Scrapbook", description: "Warm linen, pressed botanicals, sage, parchment, and olive.", appearanceMode: "light", editorMode: "light", tags: ["Light", "Nature"], decoration: { style: "botanical", density: "balanced", color: "#7d9a78", secondary: "#c69d6d" }, base: { app: "#e9e4d4", glow: "#d5dfc9", text: "#34372d", textSecondary: "#626556", muted: "#8b8b78", border: "#d9d2be", borderStrong: "#bdb69f", focus: "#6f8e68", shadow: "0 18px 48px #4f4a3724", success: "#638663", warning: "#a47742", danger: "#b65f5b", info: "#5d7e8b" }, accents: { primary: "#789174", secondary: "#b78470", tertiary: "#bf945e", soft: "#e0e7d7", hover: "#5e785b", pressed: "#cfdbc5", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#f1ead9", activity: "#cbd6bd", sidebar: "#e9e4d4", sidebarHeader: "#d8dec9", editor: "#f7f1df", editorChrome: "#eee8d7", editorTabs: "#e8e2d1", editorTab: "#e8e2d1", editorTabActive: "#f7f1df", breadcrumb: "#f2ebd9", ai: "#dfe8d6", aiHeader: "#cfddc7", aiCard: "#eaf0e4", aiComposer: "#d5e1cf", terminalFrame: "#20291f", terminalHeader: "#293427", status: "#aab99b", floating: "#f4eddd", floatingElevated: "#fbf6e9", input: "#ece6d7" }), tones: { terminal: { text: "#edf4e7", muted: "#aab9a3" }, status: { text: "#263124", muted: "#53634e" } } },
  { id: "neonRebel", label: "Neon Rebel", description: "Navy-black surfaces with electric pink, cyan, and punk energy.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Neon", "Gothic"], decoration: { style: "punk", density: "balanced", color: "#ff3da8", secondary: "#4ce6f0" }, base: { app: "#080a17", glow: "#2a1243", text: "#f5f3ff", textSecondary: "#c4bed9", muted: "#817a9d", border: "#292641", borderStrong: "#4a4165", focus: "#ff3da8", shadow: "0 24px 62px #00000080", success: "#63df9c", warning: "#f0c45b", danger: "#ff5c79", info: "#4ce6f0" }, accents: { primary: "#ff3da8", secondary: "#b050ff", tertiary: "#4ce6f0", soft: "#321837", hover: "#ff72c0", pressed: "#4b1d53", onAccent: "#130813" }, surfaces: surface({ topbar: "#0d0e1b", activity: "#070811", sidebar: "#10152b", sidebarHeader: "#171a34", editor: "#090d1a", editorChrome: "#111326", editorTabs: "#0c1020", editorTab: "#0c1020", editorTabActive: "#090d1a", breadcrumb: "#0f1224", ai: "#23102c", aiHeader: "#30143a", aiCard: "#2b1735", aiComposer: "#35163e", terminalFrame: "#03040a", terminalHeader: "#0a0a12", status: "#260d2a", floating: "#151225", floatingElevated: "#20192e", input: "#0d1020" }) },
  { id: "crimsonVinyl", label: "Crimson Vinyl", description: "Oxblood, charcoal, ivory, and restrained metallic gold.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Gothic"], decoration: { style: "vinyl", density: "subtle", color: "#b99a55", secondary: "#a72e46" }, base: { app: "#100b0e", glow: "#3e101b", text: "#f5ece8", textSecondary: "#cebdb8", muted: "#917d7e", border: "#3a252b", borderStrong: "#61404a", focus: "#c7a45d", shadow: "0 24px 60px #0000007a", success: "#7cab82", warning: "#c7a45d", danger: "#e15b6d", info: "#9ca9c5" }, accents: { primary: "#b7374e", secondary: "#c7a45d", tertiary: "#ead8c8", soft: "#3a1b24", hover: "#d45569", pressed: "#51202c", onAccent: "#fff7f2" }, surfaces: surface({ topbar: "#0a0809", activity: "#120c0f", sidebar: "#211216", sidebarHeader: "#2c171d", editor: "#151214", editorChrome: "#21191c", editorTabs: "#1b1517", editorTab: "#1b1517", editorTabActive: "#151214", breadcrumb: "#1c1618", ai: "#35131c", aiHeader: "#431722", aiCard: "#3b1d25", aiComposer: "#471a25", terminalFrame: "#080607", terminalHeader: "#100b0d", status: "#4a1420", floating: "#25181d", floatingElevated: "#302027", input: "#181114" }), agents: { planner: "#c7a45d", coder: "#a73749", reviewer: "#e16a7f", tester: "#b8bdc9", docs: "#7e2637" } },
  { id: "scarletButterfly", label: "Scarlet Butterfly", description: "A deliberate high-contrast composition of ivory, charcoal, and scarlet.", appearanceMode: "mixed", editorMode: "light", tags: ["Mixed", "Gothic", "Minimal"], decoration: { style: "butterfly", density: "balanced", color: "#d32638", secondary: "#6d6c73" }, base: { app: "#dedddd", glow: "#f3d7da", text: "#242326", textSecondary: "#57565c", muted: "#85838a", border: "#d4d1d2", borderStrong: "#aaa5a7", focus: "#cc2437", shadow: "0 22px 60px #18141638", success: "#4f8b68", warning: "#a87831", danger: "#d32638", info: "#557ba8" }, accents: { primary: "#d32638", secondary: "#171619", tertiary: "#a7a4aa", soft: "#f5dfe1", hover: "#aa1728", pressed: "#edc7cb", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#121114", activity: "#29282c", sidebar: "#f4f1ee", sidebarHeader: "#e9e4e2", editor: "#fbf8f2", editorChrome: "#efebe7", editorTabs: "#e7e2df", editorTab: "#e7e2df", editorTabActive: "#fbf8f2", breadcrumb: "#f3efea", ai: "#262329", aiHeader: "#302d33", aiCard: "#343036", aiComposer: "#2f2b31", terminalFrame: "#08080a", terminalHeader: "#151317", status: "#c81f32", floating: "#f7f3f0", floatingElevated: "#ffffff", input: "#efebe8" }), tones: { topbar: { text: "#f8f5f5", muted: "#aaa5aa" }, activity: { text: "#f4f0f1", muted: "#aaa4aa" }, ai: { text: "#f6f0f2", muted: "#b8afb4" }, terminal: { text: "#f5eff1", muted: "#9d9499" }, status: { text: "#ffffff", muted: "#f2bec4" } } },
  { id: "emeraldNocturne", label: "Emerald Nocturne", description: "Near-black forest surfaces lit by emerald and mint.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Nature"], decoration: { style: "floral-night", density: "balanced", color: "#4be49a", secondary: "#a0f0ca" }, base: { app: "#07100d", glow: "#123827", text: "#eaf9f1", textSecondary: "#b9d5c7", muted: "#789789", border: "#1e3c30", borderStrong: "#35604d", focus: "#45cf8d", shadow: "0 24px 62px #00000080", success: "#55d795", warning: "#d0b260", danger: "#e2717f", info: "#6ab8b1" }, accents: { primary: "#45cf8d", secondary: "#7ce5b1", tertiary: "#64cfc9", soft: "#153c2b", hover: "#6ee5a7", pressed: "#20543c", onAccent: "#07120d" }, surfaces: surface({ topbar: "#080d0b", activity: "#07110d", sidebar: "#0c1a14", sidebarHeader: "#12241b", editor: "#091510", editorChrome: "#0f2119", editorTabs: "#0c1b15", editorTab: "#0c1b15", editorTabActive: "#091510", breadcrumb: "#0d1d17", ai: "#0e2b20", aiHeader: "#123b2b", aiCard: "#153426", aiComposer: "#153d2d", terminalFrame: "#020705", terminalHeader: "#06100c", status: "#0d4a31", floating: "#10261d", floatingElevated: "#153227", input: "#0b1b15" }) },
  { id: "roseCelestial", label: "Rose Celestial", description: "Ruby, ivory, blush, and fine golden geometry.", appearanceMode: "mixed", editorMode: "light", tags: ["Mixed", "Celestial", "Gothic"], decoration: { style: "rose-geometry", density: "balanced", color: "#b99246", secondary: "#c22f4d" }, base: { app: "#eadedb", glow: "#f0c7cf", text: "#3b2429", textSecondary: "#71535a", muted: "#9b7f84", border: "#dfcbc7", borderStrong: "#c3a8a3", focus: "#a51f3d", shadow: "0 22px 58px #4b17233b", success: "#5d8e70", warning: "#aa813f", danger: "#c13a50", info: "#657ca5" }, accents: { primary: "#a51f3d", secondary: "#d26378", tertiary: "#b99246", soft: "#f4dadd", hover: "#80142e", pressed: "#e9c0c7", onAccent: "#fff8f3" }, surfaces: surface({ topbar: "#6f142b", activity: "#861b35", sidebar: "#f6eee4", sidebarHeader: "#eee0d4", editor: "#fffaf0", editorChrome: "#f5eade", editorTabs: "#ecdfd5", editorTab: "#ecdfd5", editorTabActive: "#fffaf0", breadcrumb: "#f7ede3", ai: "#b52c4c", aiHeader: "#8e1d38", aiCard: "#c4445e", aiComposer: "#9d243f", terminalFrame: "#280b14", terminalHeader: "#3b0e1d", status: "#7a1830", floating: "#fff6ee", floatingElevated: "#fffdf8", input: "#f5e9e2" }), tones: { topbar: { text: "#fff8f3", muted: "#e6bfc6" }, activity: { text: "#fff7f2", muted: "#e0b8c1" }, ai: { text: "#fff5f2", muted: "#edc1c8" }, terminal: { text: "#ffedf0", muted: "#c69ca5" }, status: { text: "#fff8f3", muted: "#e9bdc6" } } },
  { id: "moonlight", label: "Moonlight", description: "Cool silver-blue focus surfaces with quiet indigo accents.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Celestial", "Minimal"], decoration: { style: "celestial", density: "subtle", color: "#aab8df", secondary: "#d9deee" }, base: { app: "#121826", glow: "#263452", text: "#edf1fb", textSecondary: "#c5ccdf", muted: "#8893ad", border: "#303a50", borderStrong: "#485671", focus: "#93a7dc", shadow: "0 22px 58px #05081170", success: "#75b99d", warning: "#ceb87c", danger: "#df849b", info: "#82aee0" }, accents: { primary: "#93a7dc", secondary: "#b9a2d7", tertiary: "#cbd3e8", soft: "#2c3853", hover: "#b4c2e8", pressed: "#3e4e70", onAccent: "#111827" }, surfaces: surface({ topbar: "#171e2e", activity: "#151c2a", sidebar: "#1b2435", sidebarHeader: "#222d41", editor: "#151d2c", editorChrome: "#1e283a", editorTabs: "#1a2334", editorTab: "#1a2334", editorTabActive: "#151d2c", breadcrumb: "#1a2435", ai: "#22283d", aiHeader: "#2a3048", aiCard: "#293149", aiComposer: "#2d334b", terminalFrame: "#0b101a", terminalHeader: "#121925", status: "#1b2840", floating: "#222b3e", floatingElevated: "#2b354b", input: "#182132" }) },
  { id: "midnight", label: "Midnight", description: "The original deep indigo Zenith focus theme.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Minimal"], decoration: { style: "none", density: "none", color: "#91a5ff", secondary: "#eba3ce" }, base: { app: "#101426", glow: "#232a57", text: "#edf0ff", textSecondary: "#c2c8e7", muted: "#8d96bd", border: "#333b61", borderStrong: "#4a5684", focus: "#91a5ff", shadow: "0 22px 58px #05071a70", success: "#77c6a4", warning: "#d5b978", danger: "#f08fab", info: "#86a9ff" }, accents: { primary: "#91a5ff", secondary: "#eba3ce", tertiary: "#7bd2df", soft: "#2e3966", hover: "#bbc7ff", pressed: "#3d4c86", onAccent: "#101426" }, surfaces: surface({ topbar: "#14182c", activity: "#12172a", sidebar: "#181d35", sidebarHeader: "#202744", editor: "#151a30", editorChrome: "#1b213b", editorTabs: "#171d34", editorTab: "#171d34", editorTabActive: "#151a30", breadcrumb: "#191f38", ai: "#20203d", aiHeader: "#29264a", aiCard: "#292a4a", aiComposer: "#2e294d", terminalFrame: "#0b0e1b", terminalHeader: "#111528", status: "#12162a", floating: "#222946", floatingElevated: "#2a3152", input: "#161c32" }) },
  { id: "sakura", label: "Sakura", description: "Warm white, cream, blossom pink, and deep plum.", appearanceMode: "light", editorMode: "light", tags: ["Light", "Pastel", "Nature"], decoration: { style: "sakura", density: "balanced", color: "#e897b6", secondary: "#f4c6d8" }, base: { app: "#fff7f9", glow: "#ffe2ec", text: "#412839", textSecondary: "#725568", muted: "#a68898", border: "#f0d9e4", borderStrong: "#e2bfd0", focus: "#d66c9c", shadow: "0 20px 50px #7b37521f", success: "#609476", warning: "#b17d45", danger: "#ca527c", info: "#6c86bd" }, accents: { primary: "#d66c9c", secondary: "#ed9fbd", tertiary: "#b68ab5", soft: "#f9dfeb", hover: "#b65183", pressed: "#f3cedf", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#fffaf7", activity: "#fdebf2", sidebar: "#fff4f7", sidebarHeader: "#fbe5ed", editor: "#fffdf9", editorChrome: "#fff4f6", editorTabs: "#f9eaf0", editorTab: "#f9eaf0", editorTabActive: "#fffdf9", breadcrumb: "#fff6f7", ai: "#fde8f0", aiHeader: "#f8d8e5", aiCard: "#fff3f7", aiComposer: "#fbe0e9", terminalFrame: "#2b1728", terminalHeader: "#382035", status: "#f4dce7", floating: "#fffafa", floatingElevated: "#ffffff", input: "#fff0f5" }), tones: { terminal: { text: "#ffeaf4", muted: "#c49eb5" } } },
  { id: "aurora", label: "Aurora", description: "Dark navy shaped by violet, cyan, blue, and rose light.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Neon", "Celestial"], decoration: { style: "aurora", density: "balanced", color: "#78d7c3", secondary: "#b991ff" }, base: { app: "#0d1722", glow: "#153b48", text: "#e9fbf5", textSecondary: "#bbd6d0", muted: "#84aaa5", border: "#2b4d58", borderStrong: "#416d71", focus: "#78d7c3", shadow: "0 24px 62px #030a107a", success: "#7bd2ab", warning: "#d6b86d", danger: "#ec93ac", info: "#71b7e7" }, accents: { primary: "#78d7c3", secondary: "#b991ff", tertiary: "#ef8dbc", soft: "#24464c", hover: "#a1edda", pressed: "#315e64", onAccent: "#0d1b20" }, surfaces: surface({ topbar: "#101b29", activity: "#0f1e2a", sidebar: "#132934", sidebarHeader: "#173742", editor: "#101f2a", editorChrome: "#172c38", editorTabs: "#142633", editorTab: "#142633", editorTabActive: "#101f2a", breadcrumb: "#142a35", ai: "#282045", aiHeader: "#342757", aiCard: "#31294c", aiComposer: "#39275a", terminalFrame: "#07131a", terminalHeader: "#0d2029", status: "#143542", floating: "#1d3040", floatingElevated: "#263d4d", input: "#122630" }) },
  { id: "forest", label: "Forest", description: "Moss, sage, earth, cream, and deep evergreen.", appearanceMode: "dark", editorMode: "dark", tags: ["Dark", "Nature"], decoration: { style: "botanical", density: "subtle", color: "#78c99a", secondary: "#c8a56e" }, base: { app: "#12201b", glow: "#1d4938", text: "#ecfaf0", textSecondary: "#c0d9ca", muted: "#88aa99", border: "#315345", borderStrong: "#47705d", focus: "#78c99a", shadow: "0 22px 58px #07120d70", success: "#83d4a2", warning: "#d1ae67", danger: "#ee9cad", info: "#78b8c2" }, accents: { primary: "#78c99a", secondary: "#c8a56e", tertiary: "#8fc9bd", soft: "#28493a", hover: "#a4e5bb", pressed: "#3b6652", onAccent: "#102018" }, surfaces: surface({ topbar: "#15251f", activity: "#14231d", sidebar: "#1a2d26", sidebarHeader: "#223a30", editor: "#182923", editorChrome: "#20362d", editorTabs: "#1c3028", editorTab: "#1c3028", editorTabActive: "#182923", breadcrumb: "#1e332a", ai: "#25392e", aiHeader: "#30483a", aiCard: "#2d4437", aiComposer: "#314b3c", terminalFrame: "#0c1712", terminalHeader: "#13231c", status: "#17372a", floating: "#243c32", floatingElevated: "#2d493d", input: "#192e25" }) },
  { id: "sunset", label: "Sunset", description: "Peach, coral, dusty pink, warm violet, and deep indigo.", appearanceMode: "mixed", editorMode: "light", tags: ["Mixed", "Pastel"], decoration: { style: "sunset", density: "subtle", color: "#e88176", secondary: "#9b73d2" }, base: { app: "#f6e3dc", glow: "#ffd4bd", text: "#442c38", textSecondary: "#785866", muted: "#a58490", border: "#ecd6d2", borderStrong: "#dcbab3", focus: "#c76670", shadow: "0 20px 52px #7a38472b", success: "#58947a", warning: "#b5783f", danger: "#cf586f", info: "#6c82bd" }, accents: { primary: "#c76670", secondary: "#9b73d2", tertiary: "#eea06e", soft: "#f9ddd8", hover: "#a64c5c", pressed: "#efc6c4", onAccent: "#ffffff" }, surfaces: surface({ topbar: "#e9d7ef", activity: "#f4d8d8", sidebar: "#fae9df", sidebarHeader: "#f3ddd6", editor: "#fff9ee", editorChrome: "#f8e9e2", editorTabs: "#f1dfdc", editorTab: "#f1dfdc", editorTabActive: "#fff9ee", breadcrumb: "#f9ece5", ai: "#eed4e4", aiHeader: "#dfbed7", aiCard: "#f5e1eb", aiComposer: "#e9cbdc", terminalFrame: "#281b3d", terminalHeader: "#36254f", status: "#cdaed4", floating: "#fff5f0", floatingElevated: "#fffdfa", input: "#fae8e5" }), tones: { terminal: { text: "#fff0f7", muted: "#c0afd0" } } },
];

const backgroundCompositions: Record<ThemeName, ThemeBackground> = {
  light: {
    composition: "radial-gradient(circle at 7% 8%, #ded3ffb8 0, transparent 25%), radial-gradient(ellipse at 92% 82%, #ffd8e6a3 0, transparent 27%), radial-gradient(circle at 52% 42%, #fff8eccc 0, transparent 42%), linear-gradient(145deg, #f7f2ff 0%, #fffaf4 48%, #f9eff9 100%)",
    pattern: "radial-gradient(circle, #b69ce8 0 1px, transparent 1.7px), radial-gradient(circle, #edb7ce 0 1px, transparent 1.7px)", patternSize: "84px 84px, 126px 126px", patternOpacity: ".18", vignette: "inset 0 0 120px #baa7df18",
  },
  dark: {
    composition: "radial-gradient(ellipse at 16% -8%, #513e8959 0, transparent 34%), radial-gradient(circle at 86% 34%, #1c64724a 0, transparent 26%), radial-gradient(ellipse at 60% 108%, #672c5a45 0, transparent 38%), linear-gradient(155deg, #0d0e19 0%, #151326 54%, #101724 100%)",
    pattern: "radial-gradient(circle, #b49aff 0 1px, transparent 1.5px)", patternSize: "104px 104px", patternOpacity: ".13", vignette: "inset 0 0 160px #03040a66",
  },
  celestialDream: {
    composition: "radial-gradient(ellipse at 18% 16%, #fff7ffcc 0, transparent 26%), radial-gradient(circle at 76% 8%, #aabfff9c 0, transparent 29%), radial-gradient(ellipse at 93% 78%, #f5bddd9c 0, transparent 34%), linear-gradient(128deg, #d9d0ff 0%, #f5dff3 43%, #cbdfff 100%)",
    pattern: "radial-gradient(circle, #fff 0 1px, transparent 1.8px), radial-gradient(circle, #8c70dc 0 1px, transparent 1.7px)", patternSize: "66px 66px, 118px 118px", patternOpacity: ".24", vignette: "inset 0 0 130px #7658ba22",
  },
  sageScrapbook: {
    composition: "radial-gradient(ellipse at 2% 74%, #c5d2b69c 0, transparent 30%), radial-gradient(ellipse at 92% 12%, #d9c7a776 0, transparent 25%), linear-gradient(104deg, #eee8d7 0%, #f8f0dd 47%, #e1e7d5 100%)",
    pattern: "repeating-linear-gradient(0deg, #776f5d 0 1px, transparent 1px 4px), radial-gradient(ellipse, #7d9a78 0 1px, transparent 1.8px)", patternSize: "100% 4px, 92px 72px", patternOpacity: ".055", vignette: "inset 0 0 110px #7c76571f",
  },
  neonRebel: {
    composition: "linear-gradient(97deg, #ff16891f 0, transparent 7%, transparent 91%, #4ce6f01c 100%), radial-gradient(circle at 12% 94%, #a82a9a45 0, transparent 28%), radial-gradient(ellipse at 90% 0%, #0f6e8140 0, transparent 29%), linear-gradient(160deg, #050711 0%, #0b0a19 48%, #080e20 100%)",
    pattern: "linear-gradient(35deg, transparent 48%, #ff3da8 49% 50%, transparent 51%), radial-gradient(circle, #4ce6f0 0 1px, transparent 1.5px)", patternSize: "156px 156px, 72px 72px", patternOpacity: ".1", vignette: "inset 0 0 180px #00000099",
  },
  crimsonVinyl: {
    composition: "radial-gradient(circle at 92% 14%, #a8884429 0, transparent 21%), radial-gradient(ellipse at 8% 84%, #77182f59 0, transparent 35%), linear-gradient(132deg, #080607 0%, #1a0b10 49%, #330d18 100%)",
    pattern: "repeating-radial-gradient(circle at 88% 16%, transparent 0 20px, #b99a55 21px 22px, transparent 23px 43px)", patternSize: "100% 100%", patternOpacity: ".1", vignette: "inset 0 0 170px #00000099",
  },
  scarletButterfly: {
    composition: "linear-gradient(108deg, #151316 0 9%, transparent 9% 82%, #a81729 82% 84%, #201d20 84% 100%), radial-gradient(ellipse at 48% 54%, #fffaf1 0, #eee9e4 54%, transparent 76%), linear-gradient(145deg, #d8d3d0, #f3eeee)",
    pattern: "linear-gradient(28deg, transparent 48%, #c71f31 49% 50%, transparent 51%)", patternSize: "180px 180px", patternOpacity: ".07", vignette: "inset 0 0 120px #17141733",
  },
  emeraldNocturne: {
    composition: "radial-gradient(circle at 12% 72%, #1bcf7b38 0, transparent 25%), radial-gradient(ellipse at 88% 18%, #3a966442 0, transparent 31%), radial-gradient(circle at 56% 106%, #0e693c4d 0, transparent 33%), linear-gradient(145deg, #030906 0%, #07120d 56%, #04100b 100%)",
    pattern: "radial-gradient(circle, #5fe5a5 0 1px, transparent 2.4px), radial-gradient(circle, #b1f4d0 0 1px, transparent 2px)", patternSize: "76px 76px, 132px 132px", patternOpacity: ".17", vignette: "inset 0 0 170px #0000008a",
  },
  roseCelestial: {
    composition: "radial-gradient(circle at 82% 16%, #a51f3d42 0, transparent 28%), radial-gradient(ellipse at 8% 78%, #df9ba764 0, transparent 31%), conic-gradient(from 190deg at 58% 46%, #fff8ea 0 28%, #ead7d4 42%, #fff6ec 72%, #e8c7cb 100%)",
    pattern: "repeating-radial-gradient(circle at 70% 24%, transparent 0 27px, #b99246 28px 29px, transparent 30px 54px)", patternSize: "100% 100%", patternOpacity: ".12", vignette: "inset 0 0 125px #7f1d302b",
  },
  moonlight: {
    composition: "radial-gradient(circle at 76% 18%, #dce5ff42 0, transparent 25%), radial-gradient(ellipse at 24% 96%, #7486b730 0, transparent 35%), linear-gradient(150deg, #111725 0%, #1b2639 52%, #121b2d 100%)",
    pattern: "radial-gradient(circle, #d8e0f2 0 .8px, transparent 1.4px)", patternSize: "142px 142px", patternOpacity: ".09", vignette: "inset 0 0 150px #070b1370",
  },
  midnight: {
    composition: "radial-gradient(ellipse at 50% -20%, #4255a14d 0, transparent 40%), radial-gradient(circle at 4% 58%, #55386533 0, transparent 26%), linear-gradient(180deg, #0d1122 0%, #141a31 58%, #0e1428 100%)",
    pattern: "radial-gradient(circle, #91a5ff 0 .8px, transparent 1.4px)", patternSize: "154px 154px", patternOpacity: ".07", vignette: "inset 0 0 170px #05071573",
  },
  sakura: {
    composition: "radial-gradient(ellipse at 12% 18%, #ffd5e5c7 0, transparent 28%), radial-gradient(circle at 92% 86%, #e7ccefb0 0, transparent 30%), linear-gradient(135deg, #fff7f8 0%, #fffaf1 48%, #f9edf4 100%)",
    pattern: "radial-gradient(ellipse, #e897b6 0 1.4px, transparent 2.2px), radial-gradient(ellipse, #f4c6d8 0 1px, transparent 2px)", patternSize: "92px 126px, 134px 96px", patternOpacity: ".14", vignette: "inset 0 0 120px #cc6b9120",
  },
  aurora: {
    composition: "radial-gradient(ellipse at 18% 105%, #25cba04d 0, transparent 34%), radial-gradient(ellipse at 80% -4%, #8e61dc66 0, transparent 38%), linear-gradient(118deg, #0a1722 0%, #102833 45%, #1c1635 74%, #111b2b 100%)",
    pattern: "radial-gradient(circle, #78d7c3 0 1px, transparent 1.7px), radial-gradient(circle, #b991ff 0 1px, transparent 1.8px)", patternSize: "102px 102px, 148px 148px", patternOpacity: ".11", vignette: "inset 0 0 170px #02070d7a",
  },
  forest: {
    composition: "radial-gradient(ellipse at 8% 88%, #477e553d 0, transparent 32%), radial-gradient(circle at 86% 12%, #a6844633 0, transparent 25%), linear-gradient(138deg, #0d1813 0%, #17291f 52%, #10231c 100%)",
    pattern: "radial-gradient(ellipse, #78c99a 0 1px, transparent 2px)", patternSize: "88px 118px", patternOpacity: ".1", vignette: "inset 0 0 160px #050b0873",
  },
  sunset: {
    composition: "radial-gradient(circle at 12% 10%, #ffd8b9cc 0, transparent 29%), radial-gradient(ellipse at 86% 20%, #c9b0f0a6 0, transparent 33%), radial-gradient(circle at 70% 106%, #e77f79a6 0, transparent 37%), linear-gradient(142deg, #f7e2d8 0%, #eed4e6 51%, #d9d1f0 100%)",
    pattern: "radial-gradient(circle, #c76670 0 1px, transparent 1.8px)", patternSize: "124px 124px", patternOpacity: ".09", vignette: "inset 0 0 125px #8e5a7e26",
  },
};

export const themeRegistry = Object.fromEntries(seeds.map((seed) => [seed.id, buildTheme(seed)])) as Record<ThemeName, ZenithTheme>;
export const themes = themeRegistry;
export const themeEntries = Object.entries(themeRegistry) as [ThemeName, ZenithTheme][];
export const fallbackThemeName: ThemeName = "light";
export const isThemeName = (value: string | null | undefined): value is ThemeName => Boolean(value && value in themeRegistry);

export function cssVariablesForTheme(theme: ZenithTheme): Record<string, string> {
  return {
    "--z-app": theme.global.appBackground, "--z-glow": theme.global.backgroundGlow,
    "--z-background-composition": theme.background.composition, "--z-background-pattern": theme.background.pattern,
    "--z-background-pattern-size": theme.background.patternSize, "--z-background-pattern-opacity": theme.background.patternOpacity,
    "--z-background-vignette": theme.background.vignette,
    "--z-text": theme.global.textPrimary, "--z-text-secondary": theme.global.textSecondary, "--z-muted": theme.global.textMuted,
    "--z-border": theme.global.border, "--z-border-strong": theme.global.borderStrong, "--z-shadow": theme.global.shadow,
    "--z-focus": theme.global.focusRing, "--z-success": theme.global.success, "--z-warning": theme.global.warning,
    "--z-danger": theme.global.danger, "--z-info": theme.global.info,
    "--z-accent": theme.accent.primary, "--z-accent-secondary": theme.accent.secondary, "--z-accent-tertiary": theme.accent.tertiary,
    "--z-accent-soft": theme.accent.soft, "--z-accent-hover": theme.accent.hover, "--z-accent-pressed": theme.accent.pressed,
    "--z-on-accent": theme.accent.onAccent, "--z-selection": theme.monaco.selection, "--z-hover": theme.floating.menuHover,
    "--z-topbar-bg": theme.topbar.background, "--z-topbar-border": theme.topbar.border, "--z-topbar-text": theme.topbar.text,
    "--z-topbar-muted": theme.topbar.muted, "--z-topbar-hover": theme.topbar.buttonHover, "--z-topbar-active": theme.topbar.buttonActive,
    "--z-topbar-search-bg": theme.topbar.searchBackground, "--z-topbar-search-border": theme.topbar.searchBorder,
    "--z-activity-bg": theme.activity.background, "--z-activity-border": theme.activity.border, "--z-activity-icon": theme.activity.icon,
    "--z-activity-muted": theme.activity.iconMuted, "--z-activity-hover": theme.activity.hover, "--z-activity-selected": theme.activity.selected,
    "--z-activity-selected-icon": theme.activity.selectedIcon, "--z-activity-indicator": theme.activity.indicator,
    "--z-sidebar-bg": theme.sidebar.background, "--z-sidebar-header": theme.sidebar.header, "--z-sidebar-border": theme.sidebar.border,
    "--z-sidebar-text": theme.sidebar.text, "--z-sidebar-muted": theme.sidebar.muted, "--z-sidebar-hover": theme.sidebar.hover,
    "--z-sidebar-selected": theme.sidebar.selected, "--z-sidebar-folder": theme.sidebar.folder, "--z-sidebar-file": theme.sidebar.file,
    "--z-editor-chrome": theme.editor.chromeBackground, "--z-editor-tabs": theme.editor.tabsBackground,
    "--z-editor-tab": theme.editor.tabBackground, "--z-editor-tab-active": theme.editor.tabActiveBackground,
    "--z-editor-tab-text": theme.editor.tabText, "--z-editor-tab-active-text": theme.editor.tabActiveText,
    "--z-editor-tab-dirty": theme.editor.tabDirty, "--z-breadcrumb-bg": theme.editor.breadcrumbBackground,
    "--z-breadcrumb-text": theme.editor.breadcrumbText, "--z-breadcrumb-muted": theme.editor.breadcrumbMuted, "--z-editor": theme.monaco.background,
    "--z-ai-bg": theme.ai.background, "--z-ai-header": theme.ai.headerBackground, "--z-ai-border": theme.ai.border,
    "--z-ai-text": theme.ai.text, "--z-ai-muted": theme.ai.muted, "--z-ai-card": theme.ai.cardBackground,
    "--z-ai-card-border": theme.ai.cardBorder, "--z-ai-card-selected": theme.ai.cardSelected,
    "--z-ai-composer": theme.ai.composerBackground, "--z-ai-composer-border": theme.ai.composerBorder,
    "--z-agent-orchestrator": theme.agents.orchestrator, "--z-agent-planner": theme.agents.planner,
    "--z-agent-coder": theme.agents.coder, "--z-agent-reviewer": theme.agents.reviewer,
    "--z-agent-tester": theme.agents.tester, "--z-agent-docs": theme.agents.docs,
    "--z-terminal": theme.terminal.frameBackground, "--z-terminal-header": theme.terminal.headerBackground,
    "--z-terminal-border": theme.terminal.border, "--z-terminal-hover": theme.terminal.buttonHover,
    "--z-terminal-text": theme.terminal.emulator.foreground, "--z-status": theme.status.background,
    "--z-status-text": theme.status.text, "--z-status-muted": theme.status.muted, "--z-status-border": theme.status.border,
    "--z-status-accent": theme.status.accent, "--z-status-hover": theme.status.hover,
    "--z-overlay": theme.floating.overlay, "--z-floating": theme.floating.background, "--z-floating-elevated": theme.floating.elevated,
    "--z-floating-border": theme.floating.border, "--z-floating-shadow": theme.floating.shadow,
    "--z-menu-hover": theme.floating.menuHover, "--z-menu-selected": theme.floating.menuSelected,
    "--z-input": theme.floating.inputBackground, "--z-input-border": theme.floating.inputBorder,
    "--z-input-focus": theme.floating.inputFocus, "--z-floating-text": theme.floating.text, "--z-floating-muted": theme.floating.muted,
    "--z-decoration": theme.decoration.color, "--z-decoration-secondary": theme.decoration.secondary,
    "--z-git-added": theme.git.added, "--z-git-modified": theme.git.modified, "--z-git-deleted": theme.git.deleted,
    "--z-git-conflict": theme.git.conflict,
    "--z-surface": theme.floating.background, "--z-surface-raised": theme.floating.elevated, "--z-surface-muted": theme.floating.inputBackground,
    "--z-accent-warm": theme.accent.secondary,
  };
}
