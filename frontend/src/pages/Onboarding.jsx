import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseProfile } from "../api/profile.js";
import { useLearner } from "../context/LearnerContext.jsx";
import Button from "../components/Button.jsx";
import StepIndicator from "../components/StepIndicator.jsx";

const STEP_LABELS = ["Your Goal", "Learning Style", "Review", "Roadmap"];
const EXAMPLES = [
  "I want to become a data analyst in 3 months. I know Excel but nothing about Python or SQL.",
  "I am aiming for a front-end developer job. I have done some HTML/CSS tutorials but never built a full project.",
  "I want to learn machine learning to build AI apps. I know basic Python.",
  "I am preparing for a product manager interview at a tech company in 2 months.",
];

export default function Onboarding() {
  const { learnerId, pendingRawText, setPendingRawText, setProfileDraft, learnerName } = useLearner();
  const [text, setText] = useState(pendingRawText || "");
  const [followUp, setFollowUp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exampleIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length));
  const navigate = useNavigate();

  async function handleContinue(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    const combinedText = followUp ? `${pendingRawText}\n\n${text}` : text;
    const res = await parseProfile(learnerId, combinedText);
    setLoading(false);

    if (!res.ok) {
      setError("Could not understand that — please try rephrasing.");
      return;
    }

    const { profile, missing_fields, follow_up_question } = res.data;

    // If we already asked a follow-up question once, do not loop — proceed to VARK assessment directly
    if (!followUp && follow_up_question && missing_fields?.length) {
      setPendingRawText(combinedText);
      setFollowUp(follow_up_question);
      setText("");
      return;
    }

    setProfileDraft(profile);
    navigate("/assessment/vark");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-route/10 flex items-center justify-center text-3xl animate-pulse">
            🧠
          </div>
          <p className="text-slate-600 font-medium">Reading your goal...</p>
          <p className="text-sm text-slate-400">Our AI is building a profile from what you shared.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-route">✶ Pathwise</span>
        {learnerName && (
          <span className="text-xs text-slate-500">Hello, <strong>{learnerName}</strong></span>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <StepIndicator current={1} total={4} labels={STEP_LABELS} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6">
              {followUp ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl mb-4">
                    💡
                  </div>
                  <h1 className="font-display text-2xl text-ink">One quick question</h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{followUp}</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-route-light flex items-center justify-center text-xl mb-4">
                    🎯
                  </div>
                  <h1 className="font-display text-2xl text-ink">What is your learning goal?</h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Describe it in your own words — your target, what you already know, and your timeline.
                    The more detail, the better your roadmap.
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <div className="relative">
                <textarea
                  className="focus-ring h-36 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm resize-none bg-slate-50 focus:bg-white transition-colors"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    followUp
                      ? "Type your answer..."
                      : EXAMPLES[exampleIdx]
                  }
                  autoFocus
                />
                {!followUp && text.length === 0 && (
                  <p className="mt-1 text-[10px] text-slate-400 italic">
                    💡 Example above is just a placeholder — type your own goal.
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex gap-2 items-center">
                  <span className="text-red-500">⚠</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={!text.trim()}
                  className="flex-1 py-3"
                >
                  {followUp ? "Submit Answer →" : "Analyse My Goal →"}
                </Button>
              </div>
            </form>
          </div>

          {!followUp && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: "⏱️", tip: "Mention your timeline" },
                { icon: "📊", tip: "State your current level" },
                { icon: "🎯", tip: "Name your target role or skill" },
              ].map((t) => (
                <div key={t.tip} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                  <p className="text-lg mb-1">{t.icon}</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">{t.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}