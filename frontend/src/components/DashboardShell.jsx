import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLearner } from "../context/LearnerContext.jsx";
import ProgressRing from "./ProgressRing.jsx";
import { AIChatPanelContent } from "./AIChatPanel.jsx";

const STYLE_LABELS = {
  visual: { emoji: "🎨", label: "Visual", color: "bg-blue-50 text-blue-700 border-blue-200" },
  auditory: { emoji: "🔉", label: "Auditory", color: "bg-purple-50 text-purple-700 border-purple-200" },
  read_write: { emoji: "📚", label: "Read/Write", color: "bg-amber-50 text-amber-700 border-amber-200" },
  kinesthetic: { emoji: "🛠️", label: "Kinesthetic", color: "bg-green-50 text-green-700 border-green-200" },
  multimodal: { emoji: "🌈", label: "Multimodal", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const TYPE_ICONS = {
  course: "🎓", article: "📄", video: "🎥",
  project: "🛠️", assessment: "📝", book: "📚",
};

function NavItem({ icon, label, to, active }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-route text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function DashboardShell({ roadmap, profile, children }) {
  const { learnerName } = useLearner();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!roadmap) return <>{children}</>;

  const items = roadmap.items || [];
  const completedCount = items.filter(
    (i) => i.status === "completed" || i.status === "skipped"
  ).length;
  const activeItem =
    items.find((i) => i.status === "current") ||
    items.find((i) => i.status === "upcoming");
  const upcomingItems = items
    .filter((i) => i.status === "upcoming" || i.status === "current")
    .slice(0, 5);

  const learningStyle = profile?.learning_style;
  const dominant = learningStyle?.dominant_style;
  const styleInfo = STYLE_LABELS[dominant] || null;

  const initials = (learnerName || "L")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roadmapUrl = roadmap?.id ? `/roadmap/${roadmap.id}` : "/start";
  const isOnDashboard = location.pathname.includes("/roadmap/");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <button
          onClick={() => navigate(roadmapUrl)}
          className="text-xs font-bold uppercase tracking-widest text-route hover:opacity-75 transition-opacity"
        >
          ✶ Pathwise
        </button>
      </div>

      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-route to-route-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">
              {learnerName || "Learner"}
            </p>
            {styleInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${styleInfo.color}`}
              >
                {styleInfo.emoji} {styleInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
            Navigation
          </p>
          <NavItem icon="🏠" label="Home" to={roadmapUrl} active={isOnDashboard} />
          <NavItem icon="🗺️" label="My Roadmap" to={roadmapUrl} active={isOnDashboard} />
          <NavItem icon="👤" label="Edit Profile" to="/profile/review" active={location.pathname === "/profile/review"} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Overall Progress
          </p>
          <div className="flex items-center gap-4">
            <ProgressRing completed={completedCount} total={items.length} size={64} strokeWidth={6} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
              <p className="text-xs text-slate-500">of {items.length} completed</p>
              {completedCount > 0 && (
                <p className="text-[10px] text-route font-semibold mt-1">🔥 Keep it up!</p>
              )}
            </div>
          </div>
        </div>

        {activeItem && (
          <div className="rounded-xl border border-route/20 bg-gradient-to-br from-route-light/40 to-white p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-route">
              {activeItem.status === "current" ? "▶ Continue" : "⏭ Up Next"}
            </p>
            <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
              {activeItem.resource.title}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span>{TYPE_ICONS[activeItem.resource.type] || "📄"} {activeItem.resource.type}</span>
              <span>·</span>
              <span>⏱️ {activeItem.resource.duration_hours}h</span>
            </div>
            {activeItem.resource.url && (
              <a
                href={activeItem.resource.url}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-route text-white text-xs font-semibold py-2 rounded-lg hover:bg-route-dark transition-colors"
              >
                Open Resource ↗
              </a>
            )}
          </div>
        )}

        {upcomingItems.length > 1 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
              Coming Up
            </p>
            <ul className="space-y-1.5">
              {upcomingItems.slice(1, 5).map((item, idx) => (
                <li key={item.id} className="flex items-center gap-2.5 px-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                    {idx + 2}
                  </span>
                  <span
                    className="text-xs text-slate-600 font-medium line-clamp-1 flex-1"
                    title={item.resource.title}
                  >
                    {item.resource.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {TYPE_ICONS[item.resource.type] || "📄"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile?.goal && (
          <div className="px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Your Goal
            </p>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
              "{profile.goal}"
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4 space-y-2">
        <button
          onClick={() => { setChatOpen(true); setSidebarOpen(false); }}
          className="w-full flex items-center justify-center gap-2 bg-route/10 hover:bg-route/20 text-route font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          💬 Ask AI Assistant
        </button>
        <button
          onClick={() => navigate("/start")}
          className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => navigate(roadmapUrl)}
          className="text-xs font-bold uppercase tracking-widest text-route"
        >
          ✶ Pathwise
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="w-8 h-8 rounded-full bg-route/10 flex items-center justify-center text-route text-sm"
          >
            💬
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="focus-ring p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Left Sidebar — Desktop */}
      <aside className="hidden md:flex w-64 lg:w-72 border-r border-slate-200 bg-white sticky top-0 h-screen flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Left Sidebar — Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 border-r border-slate-200 bg-white z-30 flex flex-col transition-transform duration-300 md:hidden pt-14 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 z-20"
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 flex flex-col">
        <div className="flex-1 py-6">{children}</div>
      </main>

      {/* Right AI Chat Sidebar — Desktop (Side-by-Side when open!) */}
      {chatOpen && (
        <aside className="hidden md:flex w-80 lg:w-96 border-l border-slate-200 bg-white sticky top-0 h-screen flex-col shrink-0 z-20 shadow-sm">
          <AIChatPanelContent
            onClose={() => setChatOpen(false)}
            roadmapId={roadmap?.id}
            roadmapItems={items}
          />
        </aside>
      )}

      {/* Floating AI chat trigger button (desktop, when closed) */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-route text-white px-4 py-3 rounded-full shadow-lg hover:bg-route-dark transition-all hover:shadow-xl hover:-translate-y-0.5 font-semibold text-sm"
          title="Ask AI Assistant"
        >
          💬 Ask AI
        </button>
      )}

      {/* Mobile drawer AI Chat */}
      {chatOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 bg-slate-900/30 z-40" onClick={() => setChatOpen(false)} />
          <aside className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
            <AIChatPanelContent
              onClose={() => setChatOpen(false)}
              roadmapId={roadmap?.id}
              roadmapItems={items}
            />
          </aside>
        </div>
      )}
    </div>
  );
}