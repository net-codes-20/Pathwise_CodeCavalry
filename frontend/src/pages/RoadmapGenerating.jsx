import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateRoadmap } from "../api/roadmap.js";

const STEPS = [
  { icon: "🔍", text: "Analysing your learning profile..." },
  { icon: "🧩", text: "Matching resources to your goals..." },
  { icon: "📐", text: "Sequencing your curriculum..." },
  { icon: "✨", text: "Personalising your roadmap..." },
];

export default function RoadmapGenerating() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.profileId) { navigate("/start"); return; }
    generateRoadmap(state.profileId).then((res) => {
      if (res.ok) navigate(`/roadmap/${res.data.roadmap.id}`);
      else navigate("/profile/review");
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-route-dark via-route to-[#4a9b82] flex items-center justify-center px-6">
      <div className="text-center text-white max-w-sm">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 flex items-center justify-center text-4xl mb-8 animate-pulse">
          🗺️
        </div>
        <h1 className="font-display text-3xl font-semibold mb-2">Building your roadmap</h1>
        <p className="text-white/70 text-sm mb-8">
          Our AI is crafting a personalised learning path just for you.
        </p>
        <div className="space-y-3 text-left">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <span className="text-xl">{s.icon}</span>
              <p className="text-sm text-white/90 font-medium">{s.text}</p>
              <span className="ml-auto">
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full inline-block animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}