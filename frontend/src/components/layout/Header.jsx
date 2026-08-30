import { useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";

export default function Header({ onToggleSidebar, onOpenAI }) {
  const { learnerName, profile } = useLearner();
  const navigate = useNavigate();

  const initials = (learnerName || "Learner")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open Sidebar"
        >
          ☰
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personalized Pathway</p>
          <h2 className="text-sm font-bold text-slate-800 line-clamp-1">
            {profile?.goal || "AI & Software Engineering"}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick AI Mentor Assistant button */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-route/10 hover:bg-route/20 text-route text-xs font-semibold transition-colors"
          title="Open AI Mentor"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">Ask Mentor</span>
        </button>

        {/* Notifications Icon Placeholder */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Notifications"
            onClick={() => alert("You are on track with your learning roadmap!")}
          >
            🔔
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </div>

        {/* User avatar */}
        <button
          onClick={() => navigate("/app/profile")}
          className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-route to-route-dark flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {initials}
          </div>
          <span className="hidden md:inline text-xs font-semibold text-slate-700">{learnerName || "Learner"}</span>
        </button>
      </div>
    </header>
  );
}
