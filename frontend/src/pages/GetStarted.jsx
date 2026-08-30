import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startLearner } from "../api/learner.js";
import { useLearner } from "../context/LearnerContext.jsx";
import Button from "../components/Button.jsx";

const FEATURES = [
  { icon: "🗺️", title: "Personalised Roadmap", desc: "AI builds your exact learning path based on your goal and skill level." },
  { icon: "🧠", title: "Learning Style Aware", desc: "We adapt to how you learn — visual, hands-on, reading, or audio." },
  { icon: "💬", title: "AI Study Assistant", desc: "Ask your AI mentor anything about your roadmap, anytime." },
  { icon: "📈", title: "Track Your Progress", desc: "See milestones, streaks, and what is coming next at a glance." },
];

export default function GetStarted() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setLearnerId, setLearnerName, setProfileId, setRoadmapId } = useLearner();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setLoading(true);
    const displayName = mode === "register" ? name.trim() : username.trim();
    const res = await startLearner(displayName, username.trim().toLowerCase(), password);
    setLoading(false);

    if (!res.ok) {
      const detail = res.data?.detail;
      setError(detail === "Incorrect password."
        ? "Wrong password. Please try again."
        : "Something went wrong. Check your connection and try again.");
      return;
    }

    const data = res.data;
    setLearnerId(data.learner_id);
    setLearnerName(displayName);

    if (data.has_roadmap && data.roadmap_id) {
      setProfileId(data.profile_id);
      setRoadmapId(data.roadmap_id);
      navigate(`/roadmap/${data.roadmap_id}`);
    } else if (data.has_profile && data.profile_id) {
      setProfileId(data.profile_id);
      navigate("/profile/review");
    } else {
      navigate("/onboarding");
    }
  }

  function switchMode(m) {
    setMode(m);
    setError(null);
    setName("");
    setUsername("");
    setPassword("");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-route-dark via-route to-[#4a9b82] p-10 text-white">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">✶ Pathwise</p>
          <h1 className="mt-8 font-display text-4xl xl:text-5xl font-semibold leading-tight">
            Your AI-powered<br />learning companion.
          </h1>
          <p className="mt-4 text-white/80 text-base leading-relaxed max-w-md">
            Tell us your goal. We will build a personalised curriculum, adapt it as you grow, and guide you every step of the way.
          </p>
        </div>

        <div className="space-y-4 mt-10">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-white/70 text-xs leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-xs mt-8">© 2025 Pathwise · Built with AI</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-paper">
        <div className="lg:hidden mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-route">✶ Pathwise</p>
          <h2 className="font-display text-2xl mt-1 text-ink">Your AI Learning Companion</h2>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-7">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl text-ink">
              {mode === "login" ? "Welcome back" : "Let us get started"}
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              {mode === "login"
                ? "Log in to continue your learning journey."
                : "Create your account and get a personalised roadmap in minutes."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-ink/80 mb-1.5">Display name</label>
                <input
                  className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya"
                  autoFocus={mode === "register"}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Username</label>
              <input
                className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm bg-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. priya42"
                autoFocus={mode === "login"}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">Password</label>
              <input
                type="password"
                className="focus-ring w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <span className="text-red-500 text-sm">⚠</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-base mt-1" disabled={loading}>
              {loading
                ? mode === "login" ? "Logging in..." : "Creating account..."
                : mode === "login" ? "Log in →" : "Create account →"}
            </Button>
          </form>

          {mode === "login" && (
            <p className="mt-5 text-xs text-center text-slate-400">
              First time here?{" "}
              <button
                onClick={() => switchMode("register")}
                className="text-route underline-offset-2 hover:underline font-semibold"
              >
                Create a free account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}