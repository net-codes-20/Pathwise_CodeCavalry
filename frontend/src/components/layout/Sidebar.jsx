import { NavLink, useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { calculateProgress } from "../../utils/roadmap.js";

const NAV_ITEMS = [
  { to: "/app/home", icon: "🏠", label: "Home" },
  { to: "/app/roadmap", icon: "🗺️", label: "Roadmap" },
  { to: "/app/explore", icon: "📚", label: "Explore" },
  { to: "/app/progress", icon: "📊", label: "Progress" },
  { to: "/app/skills", icon: "🧠", label: "Skills" },
  { to: "/app/mentor", icon: "🤖", label: "AI Mentor" },
];

const BOTTOM_ITEMS = [
  { to: "/app/settings", icon: "⚙️", label: "Settings & Profile" },
];

export default function Sidebar({ onClose }) {
  const { learnerName, roadmap, profile } = useLearner();
  const navigate = useNavigate();
  const stats = calculateProgress(roadmap);

  const initials = (learnerName || "Learner")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand logo */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => {
            navigate("/app/home");
            handleLinkClick();
          }}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-xl text-route font-bold">✶</span>
          <span className="font-display font-bold text-lg text-slate-800 tracking-tight">Pathwise</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        )}
      </div>

      {/* User profile card */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-route to-route-dark flex items-center justify-center text-white font-bold text-sm shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 text-sm truncate">{learnerName || "Learner"}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">
              {profile?.experience_level || "Pathwise Learner"}
            </p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Menu</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-route text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Compact roadmap progress widget */}
        {roadmap && stats.total > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Curriculum</span>
              <span className="font-bold text-route">{stats.percentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-route rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {stats.completed} of {stats.total} modules finished
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Account</p>
          <nav className="space-y-1">
            {BOTTOM_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-route text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
