import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import sunilPhoto from "../assets/team/sunil.png";
import nethraPhoto from "../assets/team/nethra.png";
import ganeshPhoto from "../assets/team/ganesh.png";
import pranhaiPhoto from "../assets/team/pranhai.png";
import sivapriyaPhoto from "../assets/team/sivapriya.png";

const VALUE_PROPS = [
  {
    icon: "🗺️",
    title: "Personalized Roadmap",
    desc: "AI builds a structured, step-by-step curriculum tuned to your exact goal, skill level, and schedule.",
  },
  {
    icon: "🧠",
    title: "Adaptive Learning Style",
    desc: "Assesses your visual, auditory, hands-on, or reading preferences to prioritize matching content.",
  },
  {
    icon: "🤖",
    title: "Dedicated AI Mentor",
    desc: "Context-aware guidance ready 24/7 to explain concepts, suggest projects, or break down difficult items.",
  },
  {
    icon: "🔄",
    title: "Dynamic Feedback & Replan",
    desc: "Complete modules as you progress; our recommender automatically adjusts your pathway in real time.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Sunil R",
    photo: sunilPhoto,
    avatar: "👨‍💻",
    gradient: "from-purple-500 to-violet-700",
    linkedin: "https://www.linkedin.com/in/rsunil07/",
  },
  {
    name: "Nethraa P",
    photo: nethraPhoto,
    avatar: "👩‍💻",
    gradient: "from-pink-500 to-rose-700",
    linkedin: "https://www.linkedin.com/in/nethraa-p-4a1405334/",
  },
  {
    name: "Ganesh Macherla",
    photo: ganeshPhoto,
    avatar: "👨‍💻",
    gradient: "from-blue-500 to-indigo-700",
    linkedin: "https://www.linkedin.com/in/ganesh-macherla-05713b319/",
  },
  {
    name: "Pranhai Prakash",
    photo: pranhaiPhoto,
    avatar: "👨‍💻",
    gradient: "from-emerald-500 to-teal-700",
    linkedin: "https://www.linkedin.com/in/pranhai-prakash/",
  },
  {
    name: "Sivapriya V",
    photo: sivapriyaPhoto,
    avatar: "👩‍💻",
    gradient: "from-amber-500 to-orange-700",
    linkedin: "https://www.linkedin.com/in/sivapriya-venkateswarar/",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper dark:bg-[#0b0f19] flex flex-col font-body text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl text-route font-bold">✶</span>
            <span className="font-display font-bold text-xl text-ink dark:text-white tracking-tight">Pathwise</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-route px-4 py-2 rounded-lg transition-colors"
            >
              Log In
            </button>
            <Button onClick={() => navigate("/signup")} className="px-5 py-2 text-sm shadow-xs">
              Get Started Free →
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-route-light text-route dark:bg-route/20 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-6">
          <span>✨</span> Next-Gen AI Learning Platform
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink dark:text-white leading-tight tracking-tight">
          Master any skill with an <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-route-dark via-route to-[#3a8b75] bg-clip-text text-transparent">
            AI-crafted roadmap
          </span>
        </h1>

        <p className="mt-6 text-slate-600 dark:text-slate-300 text-lg sm:text-xl max-w-2xl leading-relaxed">
          Tell us where you want to go. We analyze your experience, goals, and learning style to generate your customized, step-by-step curriculum.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-md"
          >
            Start Your Free Roadmap →
          </Button>
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-xs"
          >
            Sign in to Existing Path
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-20 text-left w-full">
          {VALUE_PROPS.map((feat) => (
            <div
              key={feat.title}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-route-light/60 dark:bg-route/20 flex items-center justify-center text-2xl mb-4">
                {feat.icon}
              </div>
              <h3 className="font-display font-semibold text-lg text-ink dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Engineering Team / Built By Section (Single Row) */}
        <div className="mt-24 w-full text-center space-y-8">
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
              Engineering Team
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white">
              Built by Code Cavalry
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Engineered with modern fullstack architecture, deterministic recommendation algorithms, and grounded LLM intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 flex flex-col items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-1 transition-all space-y-4 group"
              >
                <div className="space-y-3 flex flex-col items-center w-full">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-700 aspect-square"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-4xl shadow-sm text-white aspect-square`}
                    >
                      {member.avatar}
                    </div>
                  )}
                  <div className="w-full">
                    <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {member.name}
                    </h4>
                  </div>
                </div>

                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0077b5] text-slate-700 hover:text-white dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-[#0077b5] dark:hover:text-white text-xs font-semibold transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.75A1.66 1.66 0 0 0 6.17 8.41a1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66 1.66 1.66 0 0 0-1.66-1.66Z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Pathwise · AI-Powered Personalized Learning Path Recommender</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">Privacy</span>
            <span>·</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">Terms</span>
            <span>·</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
