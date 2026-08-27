import { useState, useRef, useEffect } from "react";
import { useLearner } from "../../context/LearnerContext.jsx";
import { askMentor } from "../../api/mentor.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/Button.jsx";
import ChatMessage from "../../components/ChatMessage.jsx";

const SUGGESTIONS = [
  "Explain my current topic in simple terms",
  "What should I learn next today?",
  "Why was this roadmap sequence recommended?",
  "Help me with practical project ideas",
  "How can I test my knowledge for this milestone?",
];

export default function MentorView() {
  const { roadmap, roadmapId, profile, selectedItem } = useLearner();

  const chatStorageKey = roadmapId
    ? `mentor_chat_history_${roadmapId}`
    : "mentor_chat_history_global";

  const getInitialGreeting = () => [
    {
      role: "ai",
      text: `Hello! I am your AI Mentor for "${profile?.goal || "your learning pathway"}". I have full context on your curriculum milestones, completed topics, and learning style. How can I assist your study session today?`,
      timestamp: new Date().toISOString(),
    },
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getInitialGreeting();
  });

  // Reload history when roadmapId changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages(getInitialGreeting());
  }, [roadmapId, chatStorageKey]);

  // Persist messages per roadmap
  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      }
    } catch {
      // ignore
    }
  }, [messages, chatStorageKey]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    const userMsg = { role: "user", text: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await askMentor({
        message: query,
        roadmapId,
        roadmap,
        profile,
        currentItem: activeItem,
      });

      const aiMsg = { role: "ai", text: res.text, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I encountered an issue fetching advice. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const fresh = getInitialGreeting();
    setMessages(fresh);
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-140px)]">
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-route/10 dark:bg-route/20 flex items-center justify-center text-xl shrink-0">
              🤖
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                AI Learning Mentor
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contextual tutor for{" "}
                <strong className="text-slate-700 dark:text-slate-200">{profile?.goal || "AI & Software Engineering"}</strong>
                {activeItem?.resource?.title && (
                  <span className="text-route font-medium ml-1">· Active: {activeItem.resource.title}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-block">
              ● Pathway Context Active
            </span>
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset conversation for this pathway"
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-route/10 dark:bg-route/20 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-route text-white rounded-tr-xs"
                      : "bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                  }`}
                >
                  <ChatMessage text={msg.text} isUser={msg.role === "user"} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-route/10 dark:bg-route/20 flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-5 py-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
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
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-850/70 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Quick Discussion Prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-route hover:text-route px-3 py-1.5 rounded-full transition-colors text-left cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0">
            <input
              type="text"
              className="flex-1 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
              placeholder="Ask anything about concepts, topics, or what to learn next..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 text-sm font-semibold rounded-2xl shadow-xs shrink-0"
            >
              Send ↑
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
