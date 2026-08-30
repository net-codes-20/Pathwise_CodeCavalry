import { useState, useRef, useEffect } from "react";
import { useLearner } from "../../context/LearnerContext.jsx";
import { askMentor } from "../../api/mentor.js";
import ChatMessage from "../ChatMessage.jsx";

const WELCOME = "Hi! I'm your AI Mentor. Ask me anything about your learning roadmap, topics you're studying, or what skills to develop next.";

export default function AIDrawer({ open, onClose }) {
  const { roadmap, roadmapId, profile, selectedItem } = useLearner();
  const [messages, setMessages] = useState([{ role: "ai", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeItem =
    selectedItem ||
    roadmap?.items?.find((i) => i.status === "current" || i.status === "in_progress") ||
    roadmap?.items?.find((i) => i.status === "upcoming") ||
    roadmap?.items?.[0];

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const res = await askMentor({
        message: query,
        roadmapId,
        roadmap,
        profile,
        currentItem: activeItem,
      });

      setMessages((prev) => [...prev, { role: "ai", text: res.text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "I ran into an issue fetching that response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (prompt) => {
    setInput(prompt);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-screen w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-route to-route-dark text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              🤖
            </div>
            <div>
              <p className="font-semibold text-sm">AI Mentor</p>
              <p className="text-white/70 text-[11px]">Context-aware learning assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
            aria-label="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-route/10 flex items-center justify-center text-xs shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-route text-white rounded-tr-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                }`}
              >
                <ChatMessage text={msg.text} isUser={msg.role === "user"} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-full bg-route/10 flex items-center justify-center text-xs shrink-0 mt-1">
                🤖
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-xs flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompt suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Suggested Prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "What should I learn next?",
                "Explain my current topic in simple terms",
                "Help me with project ideas",
                "Why was my roadmap designed this way?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestion(prompt)}
                  className="text-xs bg-white border border-slate-200 text-slate-700 hover:border-route hover:text-route px-2.5 py-1 rounded-full transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
            placeholder="Ask AI Mentor anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-route text-white flex items-center justify-center hover:bg-route-dark transition-all disabled:opacity-50 font-bold shrink-0 shadow-sm"
          >
            ↑
          </button>
        </form>
      </aside>
    </>
  );
}
