import { useState } from "react";
import { Bot, Brain, Code2, FileText, History, Paperclip, Pin, Send, Sparkles, X } from "lucide-react";

const agents = [["Planner", "Analyzing requirements...", Brain, "lavender"], ["Coder", "Ready to code ✨", Code2, "mint"], ["Reviewer", "Waiting for changes", Sparkles, "rose"], ["Tester", "Waiting for build", Bot, "blue"], ["Docs", "Ready to document", FileText, "peach"]] as const;

export default function AIPanel({ compact = false, onClose }: { compact?: boolean; onClose?: () => void }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!message.trim()) return; setReply(`Zenith received: “${message.trim()}”`); setMessage(""); };
  return <aside className={`ai-panel ${compact ? "compact" : ""}`}><header className="ai-header"><div><Sparkles size={18} /><strong>Zenith AI</strong><span>⌄</span></div><div><button title="Chat history"><History size={16} /></button><button title="Pin panel"><Pin size={16} /></button><button title="Close Zenith AI" onClick={onClose}><X size={16} /></button></div></header><div className="ai-greeting"><span>👋 Hi there!</span><p>{reply || "How can I help you build something amazing today?"}</p></div><p className="section-label">AI TEAM <CircleInfo /></p><div className="agent-list">{agents.map(([name, description, Icon, color]) => <button className="agent-card" key={name} onClick={() => setReply(`${name} is ready to help.`)}><span className={`agent-icon ${color}`}><Icon size={17} /></span><span><strong>{name}</strong><small>{description}</small></span></button>)}</div><form className="ai-composer" onSubmit={submit}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask Zenith anything..." /><div><span>@</span><Paperclip size={16} /><code>&lt;/&gt;</code><button aria-label="Send"><Send size={16} /></button></div></form></aside>;
}
function CircleInfo() { return <span className="info-dot">i</span>; }
