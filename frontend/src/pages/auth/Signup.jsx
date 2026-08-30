import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { startLearner } from "../../api/learner.js";
import { useLearner } from "../../context/LearnerContext.jsx";
import Button from "../../components/Button.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setLearnerId, setLearnerName, clearOnboardingDraft, setTheme } = useLearner();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 4) {
      setError("Password should be at least 4 characters.");
      return;
    }

    setLoading(true);
    const trimmedName = name.trim();
    const trimmedUser = username.trim().toLowerCase();
    const res = await startLearner(trimmedName, trimmedUser, password);
    setLoading(false);

    if (!res.ok) {
      setError("Could not create account. Please try again.");
      return;
    }

    clearOnboardingDraft();
    const data = res.data;
    setLearnerId(data.learner_id);
    setLearnerName(trimmedName);
    if (data.theme) {
      setTheme(data.theme);
    }
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 mb-2">
          <span className="text-2xl text-route font-bold">✶</span>
          <span className="font-display font-bold text-2xl text-ink">Pathwise</span>
        </button>
        <h2 className="font-display text-2xl font-bold text-ink mt-2">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">Get your personalized learning path in minutes</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xs border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                required
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full py-3 text-sm font-semibold mt-2">
              {loading ? "Creating account..." : "Create Account →"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-route font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
