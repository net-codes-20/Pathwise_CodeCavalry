import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ANALYSIS_STEPS = [
  { id: 1, text: "Understanding your goal & timeline", icon: "🎯" },
  { id: 2, text: "Analyzing your current skills & experience", icon: "🧠" },
  { id: 3, text: "Identifying prerequisite skill gaps", icon: "🔍" },
  { id: 4, text: "Aligning with your VARK learning preference", icon: "🎨" },
  { id: 5, text: "Matching curated course & project catalog", icon: "📚" },
  { id: 6, text: "Structuring progressive roadmap milestones", icon: "✨" },
];

export default function AIAnalyzing() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev < ANALYSIS_STEPS.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            navigate("/onboarding/summary", { state: { profile: state?.profile } });
          }, 600);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(interval);
  }, [navigate, state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-route-dark via-route to-[#2d6f5e] flex items-center justify-center p-6 text-white font-body">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center text-3xl animate-bounce">
          🤖
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Building your learning path</h2>
          <p className="text-sm text-white/70 mt-1">Our AI is analyzing your goals, skills, and preferences</p>
        </div>

        <div className="space-y-3 text-left">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = idx < completedSteps;
            const isCurrent = idx === completedSteps;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isDone
                    ? "bg-white/20 border-white/30 text-white font-medium"
                    : isCurrent
                    ? "bg-white/10 border-white/40 text-white animate-pulse"
                    : "bg-black/10 border-white/10 text-white/40"
                }`}
              >
                <span className="text-base">{step.icon}</span>
                <span className="text-xs sm:text-sm flex-1">{step.text}</span>
                {isDone && <span className="text-emerald-300 font-bold text-xs">✓ Done</span>}
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
