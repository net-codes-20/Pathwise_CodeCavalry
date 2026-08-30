import { useState, useRef, useEffect } from "react";
import { explainItem } from "../api/roadmap.js";

const WELCOME = "Hi! I'm your AI learning assistant. Ask me anything about your roadmap — why a resource is recommended, how to approach a topic, or what to focus on next.";

export function AIChatPanelContent({ onClose, roadmapId, roadmapItems = [] }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: WELCOME }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    const lq = q.toLowerCase();
    const matched = roadmapItems.find(item =>
      item.resource?.title?.toLowerCase().includes(lq) ||
      lq.includes(item.resource?.title?.toLowerCase())
    );

    let reply = "";
    if (matched && roadmapId) {
      const res = await explainItem(roadmapId, matched.id);
      reply = res.ok
        ? res.data.explanation
        : "I couldn't fetch an explanation right now — please try again.";
    } else {
      const titles = roadmapItems.map(i => i.resource?.title).filter(Boolean).slice(0, 5).join(", ");
      reply = `Great question! Based on your roadmap, you're working through: ${titles || "your personalised curriculum"}. Could you specify which resource or topic you'd like me to explain? You can ask things like "Why should I learn X?" or "Explain the concept of Y."`;
    }

    setLoading(false);
    setMessages(prev => [...prev, { role: "ai", text: reply }]);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-route to-route-dark shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Pathwise AI</p>
            <p className="text-white/70 text-[10px]">Your learning assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors text-sm font-bold"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="w-6 h-6 rounded-full bg-route/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-route font-bold">AI</span>
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-route text-white rounded-tr-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-route/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] text-route font-bold">AI</span>
            </div>
            <div className="bg-slate-100 px-3 py-2 rounded-2xl rounded-tl-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Try asking</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Why is this in my path?",
              "What should I focus on?",
              "Explain the first topic",
              "How long will this take?",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-route/30 text-route hover:bg-route-light transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2 shrink-0">
        <input
          className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
          placeholder="Ask anything about your roadmap..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-full bg-route text-white flex items-center justify-center hover:bg-route-dark transition-colors disabled:opacity-50 shrink-0 font-bold"
        >
          ↑
        </button>
      </form>
    </div>
  );
}

export default function AIChatPanel({ open, onClose, roadmapId, roadmapItems = [] }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col md:hidden">
        <AIChatPanelContent onClose={onClose} roadmapId={roadmapId} roadmapItems={roadmapItems} />
      </aside>
    </>
  );
}