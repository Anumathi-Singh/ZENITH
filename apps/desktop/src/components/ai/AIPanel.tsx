import { useRef, useState } from "react";
import { Bot, Brain, ChevronDown, Code2, FileText, History, MoreHorizontal, Paperclip, Pin, Send, Sparkles, X } from "lucide-react";
import { useDismissableLayer } from "../ui/useDismissableLayer";
import { useLayoutStore } from "../layout/layoutStore";

const agents = [
  ["Planner", "Analyzing requirements", Brain, "planner"],
  ["Coder", "Ready to code", Code2, "coder"],
  ["Reviewer", "Waiting for changes", Sparkles, "reviewer"],
  ["Tester", "Waiting for build", Bot, "tester"],
  ["Docs", "Ready to document", FileText, "docs"],
] as const;

export default function AIPanel() {
  const { aiPanelOpen, aiPanelWidth, sidePanelWidth, activePanel, setAIPanelOpen, setAIPanelWidth } = useLayoutStore();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Planner");
  const [isPinned, setIsPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const menuRef = useDismissableLayer<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const startWidth = useRef(aiPanelWidth);
  const startX = useRef(0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setReply(`${selectedAgent} received your note. AI execution will be available in a future milestone.`);
    setMessage("");
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    startX.current = event.clientX;
    startWidth.current = aiPanelWidth;
    setIsResizing(true);
    const workspace = event.currentTarget.closest(".workspace");

    const resize = (moveEvent: PointerEvent) => {
      const editorMinimum = 420;
      const activityWidth = 72;
      const panelSpacing = 28;
      const availableWidth = workspace?.getBoundingClientRect().width ?? window.innerWidth;
      const leftWidth = activePanel ? sidePanelWidth : 0;
      const maximum = Math.max(280, availableWidth - activityWidth - leftWidth - editorMinimum - panelSpacing);
      setAIPanelWidth(Math.min(startWidth.current + startX.current - moveEvent.clientX, maximum));
    };
    const stopResize = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize, { once: true });
    window.addEventListener("pointercancel", stopResize, { once: true });
  };

  const resizeByKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); setAIPanelWidth(aiPanelWidth + 16); }
    if (event.key === "ArrowRight") { event.preventDefault(); setAIPanelWidth(aiPanelWidth - 16); }
  };

  const selectAgent = (name: string) => {
    setSelectedAgent(name);
    setReply(`${name} is selected and ready to help.`);
  };

  return (
    <aside
      aria-label="Zenith AI"
      aria-hidden={!aiPanelOpen}
      className={`ai-panel-shell ${aiPanelOpen ? "is-open" : ""} ${isResizing ? "is-resizing" : ""}`}
      style={{ width: aiPanelOpen ? aiPanelWidth : 0 }}
    >
      {aiPanelOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Zenith AI panel"
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={resizeByKeyboard}
          className="panel-resize-handle panel-resize-handle-left"
        />
      )}
      <section className="ai-panel" style={{ width: aiPanelWidth }}>
        <header className="ai-header">
          <div className="ai-title"><Sparkles size={17} /><strong>Zenith AI</strong><ChevronDown size={15} /></div>
          <div className="ai-header-actions" ref={menuRef}>
            <button title="Conversation history" onClick={() => setReply("Conversation history will appear when Zenith AI is connected.")}><History size={16} /></button>
            <button className={isPinned ? "is-active" : ""} title="Pin panel" aria-pressed={isPinned} onClick={() => setIsPinned((value) => !value)}><Pin size={16} /></button>
            <button title="AI panel options" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal size={17} /></button>
            <button title="Close Zenith AI" onClick={() => setAIPanelOpen(false)}><X size={17} /></button>
            {menuOpen && <div className="zenith-popover ai-menu" role="menu"><button role="menuitem" onClick={() => { setReply(""); setMenuOpen(false); }}>Start a new local chat</button><button role="menuitem" onClick={() => { setReply(""); setMenuOpen(false); }}>Clear local response</button></div>}
          </div>
        </header>
        <div className="ai-scroll-area">
          <div className="ai-greeting"><span>Welcome to Zenith AI</span><p>{reply || "Choose a teammate or describe what you would like to build."}</p></div>
          <div className="ai-section-heading"><span>AI TEAM</span><small>{selectedAgent} selected</small></div>
          <div className="agent-list">
            {agents.map(([name, description, Icon, color]) => (
              <button className={`agent-card ${selectedAgent === name ? "selected" : ""}`} key={name} onClick={() => selectAgent(name)}>
                <span className={`agent-icon ${color}`}><Icon size={17} /></span>
                <span><strong>{name}</strong><small>{description}</small></span>
              </button>
            ))}
          </div>
        </div>
        <form className="ai-composer" onSubmit={submit}>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Ask ${selectedAgent} anything...`} aria-label="Message Zenith AI" />
          <div><span>@</span><Paperclip size={16} /><code>&lt;/&gt;</code><button aria-label="Send message"><Send size={16} /></button></div>
        </form>
      </section>
    </aside>
  );
}
