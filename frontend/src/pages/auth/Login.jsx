import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { startLearner } from "../../api/learner.js";
import { useLearner } from "../../context/LearnerContext.jsx";
import Button from "../../components/Button.jsx";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setLearnerId, setLearnerName, setProfileId, setRoadmapId, setTheme } = useLearner();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    const trimmedUser = username.trim().toLowerCase();
    const res = await startLearner(trimmedUser, trimmedUser, password);
    setLoading(false);

    if (!res.ok) {
      const detail = res.data?.detail;
      setError(
        detail === "Incorrect password."
          ? "Wrong password. Please check your credentials and try again."
          : "Could not log in. Check your connection or register a new account."
      );
      return;
    }

    const data = res.data;
    setLearnerId(data.learner_id);
    setLearnerName(data.name || trimmedUser);

    if (data.theme) {
      setTheme(data.theme);
    }

    if (data.has_roadmap && data.roadmap_id) {
      setProfileId(data.profile_id);
      setRoadmapId(data.roadmap_id);
      navigate("/app/home");
    } else if (data.has_profile && data.profile_id) {
      setProfileId(data.profile_id);
      navigate("/onboarding/summary");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 mb-2">
          <span className="text-2xl text-route font-bold">✶</span>
          <span className="font-display font-bold text-2xl text-ink">Pathwise</span>
        </button>
        <h2 className="font-display text-2xl font-bold text-ink mt-2">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue your learning journey</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xs border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                placeholder="e.g. alex42"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold mt-2">
              {loading ? "Logging in..." : "Log In →"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link to="/signup" className="text-route font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
