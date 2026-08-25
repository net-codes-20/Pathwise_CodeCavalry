import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { createProfile } from "../../api/profile.js";
import { generateRoadmap } from "../../api/roadmap.js";
import { getStyleInfo } from "../../utils/roadmap.js";
import Button from "../../components/Button.jsx";

const GOAL_TYPE_LABELS = {
  job: { label: "Land a Full-Time Job", icon: "💼" },
  internship: { label: "Secure an Internship", icon: "🎯" },
  career_transition: { label: "Career Switch", icon: "🔄" },
  new_skill: { label: "Learn a New Skill", icon: "🚀" },
  project: { label: "Build a Real Project", icon: "🛠️" },
  academic: { label: "Academic / Research", icon: "🔬" },
  certification: { label: "Professional Certification", icon: "📜" },
  interview_prep: { label: "Interview Preparation", icon: "⚡" },
};

export default function ProfileSummary() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { learnerId, profileDraft, setProfileId, setRoadmapId, clearOnboardingDraft } = useLearner();

  const profile = state?.profile || profileDraft || {
    goal: "Become an AI Engineer and build intelligent systems",
    goal_type: "job",
    experience_level: "intermediate",
    interests: ["AI / Machine Learning", "Web Development"],
    current_skills: ["Python", "Git", "SQL"],
    timeline_months: 6,
    weekly_time_hours: 14,
    learning_style: {
      dominant_style: "kinesthetic",
      scores: { kinesthetic: 8, visual: 5, read_write: 4, auditory: 3 },
    },
  };

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const dominantStyle = profile.learning_style?.dominant_style || profile.dominant_style || "multimodal";
  const styleInfo = getStyleInfo(dominantStyle);
  const varkScores = profile.learning_style?.scores || profile.vark_scores || {};

  // Infer priority skill gaps based on goal & current skills
  const currentSkillSet = new Set((profile.current_skills || []).map((s) => s.toLowerCase()));
  const targetGaps = [
    "Machine Learning Foundations",
    "Deep Learning & Neural Nets",
    "Model Evaluation & Tuning",
    "Vector Databases & RAG",
    "LLM Fine-tuning & Deployment",
  ].filter((gap) => !currentSkillSet.has(gap.toLowerCase()));

  const handleGenerateRoadmap = async () => {
    if (!learnerId) {
      setError("Please log in or sign up first.");
      navigate("/signup");
      return;
    }

    setGenerating(true);
    setError(null);

    // 1. Create Profile
    const profilePayload = {
      goal: profile.goal,
      goal_type: profile.goal_type || "new_skill",
      experience_level: profile.experience_level,
      current_skills: profile.current_skills,
      interests: profile.interests,
      timeline_months: profile.timeline_months,
      weekly_time_hours: profile.weekly_time_hours,
      constraints: profile.constraints || [],
      learning_style: profile.learning_style,
    };

    const profRes = await createProfile(learnerId, profilePayload);
    if (!profRes.ok) {
      setGenerating(false);
      setError("Could not save learning profile. Please try again.");
      return;
    }

    const savedProfileId = profRes.data.profile_id;
    setProfileId(savedProfileId);

    // 2. Generate Roadmap
    const roadRes = await generateRoadmap(savedProfileId);
    setGenerating(false);

    if (!roadRes.ok) {
      setError("Roadmap generation failed. Please try again.");
      return;
    }

    clearOnboardingDraft();
    const newRoadmapId = roadRes.data.roadmap.id;
    setRoadmapId(newRoadmapId);
    navigate(`/app/home`);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-body py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-route">Profile Analysis Ready</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">Your Learning Profile</h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Here is the profile we constructed from your goals and preferences. Review it before generating your tailored curriculum.
          </p>
        </div>

        {/* Profile Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role / Focus</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {profile.target_role || profile.targetRole || profile.goal}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-route/10 text-route text-xs font-semibold">
                  <span>{GOAL_TYPE_LABELS[profile.goal_type]?.icon || "🎯"}</span>
                  <span>{GOAL_TYPE_LABELS[profile.goal_type]?.label || profile.goal_type || "Career Goal"}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability & Commitment</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>⏱️ <strong>{profile.timeline_months || 6} months</strong> target timeline</p>
                <p>🕐 <strong>{profile.weekly_time_hours || 10} hours/week</strong> study dedication</p>
              </div>
            </div>
          </div>

          {/* Interests & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Target Interests</p>
              <div className="flex flex-wrap gap-2">
                {(profile.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="bg-route-light/50 text-route text-xs font-semibold px-3 py-1 rounded-full border border-route/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dominant Learning Preference</p>
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-3xl">{styleInfo.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{styleInfo.label}</p>
                  <p className="text-xs text-slate-500">{styleInfo.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.current_skills || []).map((skill) => (
                  <span key={skill} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Priority Skill Gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {targetGaps.map((gap) => (
                  <span key={gap} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1 rounded-lg font-medium border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                    <span className="text-route font-bold">🎯</span> {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            ← Edit Profile Details
          </button>

          <Button
            type="button"
            onClick={handleGenerateRoadmap}
            disabled={generating}
            className="w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-md bg-gradient-to-r from-route to-route-dark"
          >
            {generating ? "✨ Generating Personalized Roadmap..." : "✨ Generate My Personalized Roadmap →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
