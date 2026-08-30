import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfile } from "../api/profile.js";
import { generateRoadmap } from "../api/roadmap.js";
import { useLearner } from "../context/LearnerContext.jsx";
import TagInput from "../components/TagInput.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import ErrorState from "../components/ErrorState.jsx";

const GOAL_TYPES = [
  { value: "new_skill", label: "Learn a New Skill" },
  { value: "job", label: "Land a Job" },
  { value: "internship", label: "Get an Internship" },
  { value: "career_transition", label: "Career Transition" },
  { value: "project", label: "Build a Project" },
  { value: "interview_prep", label: "Interview Prep" },
  { value: "certification", label: "Get Certified" },
  { value: "academic", label: "Academic Study" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just starting out", icon: "🌱" },
  { value: "intermediate", label: "Intermediate", desc: "Some experience", icon: "🚀" },
  { value: "advanced", label: "Advanced", desc: "Building on expertise", icon: "⭐" },
];

const STYLE_META = {
  visual:      { icon: "🎨", label: "Visual", desc: "Diagrams & Videos", color: "border-blue-300 bg-blue-50 text-blue-700" },
  auditory:    { icon: "🔉", label: "Auditory", desc: "Talks & Lectures",  color: "border-purple-300 bg-purple-50 text-purple-700" },
  read_write:  { icon: "📚", label: "Read/Write", desc: "Articles & Books", color: "border-amber-300 bg-amber-50 text-amber-700" },
  kinesthetic: { icon: "🛠️", label: "Kinesthetic", desc: "Labs & Projects",  color: "border-green-300 bg-green-50 text-green-700" },
  multimodal:  { icon: "🌈", label: "Multimodal", desc: "Balanced mix",      color: "border-rose-300 bg-rose-50 text-rose-700" },
};

const STEP_LABELS = ["Your Goal", "Learning Style", "Review", "Roadmap"];

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ProfileReview() {
  const { learnerId, profileDraft, setProfileId, learnerName, roadmapId } = useLearner();
  const [form, setForm] = useState(() => {
    const d = profileDraft || {};
    return {
      goal: d.goal || "",
      goal_type: d.goal_type || "new_skill",
      experience_level: d.experience_level || "beginner",
      current_skills: d.current_skills || [],
      interests: d.interests || [],
      timeline_months: d.timeline_months ?? null,
      weekly_time_hours: d.weekly_time_hours ?? 10,
      constraints: d.constraints || [],
      learning_style: d.learning_style || {
        dominant_style: "visual",
        scores: { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 },
      },
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    setSubmitting(true);
    setError(null);

    const createRes = await createProfile(learnerId, form);
    if (!createRes.ok) {
      setSubmitting(false);
      setError("Could not save your profile. Please try again.");
      return;
    }

    const profileId = createRes.data.profile_id;
    setProfileId(profileId);
    navigate("/roadmap/generating", { state: { profileId } });

    const roadmapRes = await generateRoadmap(profileId);
    if (!roadmapRes.ok) {
      navigate("/profile/review");
      setError("Roadmap generation failed. Please try again.");
      return;
    }
    navigate(`/roadmap/${roadmapRes.data.roadmap.id}`);
  }

  const dominant = form.learning_style?.dominant_style;
  const styleMeta = STYLE_META[dominant];

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-route">✶ Pathwise</span>
          {roadmapId && (
            <button
              onClick={() => navigate(`/roadmap/${roadmapId}`)}
              className="text-xs font-semibold text-slate-600 hover:text-route flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors"
            >
              ← Back to My Roadmap
            </button>
          )}
        </div>
        {learnerName && <span className="text-xs text-slate-500">Hello, <strong>{learnerName}</strong></span>}
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-5">
          <StepIndicator current={3} total={4} labels={STEP_LABELS} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-ink mt-4">Review your profile</h1>
              <p className="mt-1 text-sm text-slate-500">
                We built this from what you described. Edit anything before we generate your roadmap.
              </p>
            </div>
          </div>

          <SectionCard icon="🎯" title="Learning Goal">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Goal description
                </label>
                <textarea
                  className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:bg-white transition-colors resize-none h-20"
                  value={form.goal}
                  onChange={(e) => set("goal", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Goal type
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_TYPES.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => set("goal_type", g.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        form.goal_type === g.value
                          ? "bg-route text-white border-route"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon="📊" title="Experience Level">
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => set("experience_level", l.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.experience_level === l.value
                      ? "border-route bg-route-light/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-2xl mb-1">{l.icon}</p>
                  <p className={`text-xs font-bold ${form.experience_level === l.value ? "text-route-dark" : "text-slate-700"}`}>
                    {l.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon="🛠️" title="Skills & Interests">
            <div className="space-y-4">
              <TagInput
                label="Current skills"
                values={form.current_skills}
                onChange={(v) => set("current_skills", v)}
                placeholder="Add a skill and press Enter"
              />
              <TagInput
                label="Interests"
                values={form.interests}
                onChange={(v) => set("interests", v)}
                placeholder="e.g. web development, AI, finance"
              />
              <TagInput
                label="Constraints (optional)"
                values={form.constraints}
                onChange={(v) => set("constraints", v)}
                placeholder="e.g. weekends only, no paid courses"
              />
            </div>
          </SectionCard>

          <SectionCard icon="⏱️" title="Your Schedule">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Timeline (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:bg-white"
                  value={form.timeline_months ?? ""}
                  onChange={(e) => set("timeline_months", e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Weekly study time
                </label>
                <select
                  className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                  value={form.weekly_time_hours ?? 10}
                  onChange={(e) => set("weekly_time_hours", Number(e.target.value))}
                >
                  <option value={2}>2 hrs/week (Light)</option>
                  <option value={5}>5 hrs/week (~45m/day)</option>
                  <option value={10}>10 hrs/week (~1.5h/day)</option>
                  <option value={14}>14 hrs/week (2h/day)</option>
                  <option value={20}>20 hrs/week (~3h/day)</option>
                  <option value={30}>30 hrs/week (~4.5h/day)</option>
                  <option value={40}>40 hrs/week (Full-time)</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon="🧠" title="Learning Style">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(STYLE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() =>
                    set("learning_style", {
                      dominant_style: key,
                      scores: form.learning_style?.scores || {},
                    })
                  }
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    dominant === key
                      ? `${meta.color} border-current shadow-sm`
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xl mb-1">{meta.icon}</p>
                  <p className="text-xs font-bold text-slate-800">{meta.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{meta.desc}</p>
                </button>
              ))}
            </div>
            {styleMeta && (
              <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${styleMeta.color} border`}>
                {styleMeta.icon} Your roadmap will prioritise <strong>{styleMeta.desc}</strong>
              </div>
            )}
          </SectionCard>

          {error && <ErrorState message={error} onRetry={handleGenerate} />}

          <div className="bg-gradient-to-r from-route to-route-dark rounded-2xl p-6 text-white">
            <h3 className="font-display text-xl font-semibold">Ready to build your roadmap?</h3>
            <p className="text-white/80 text-sm mt-1 mb-4">
              Our AI will curate a personalised sequence of resources just for you.
            </p>
            <button
              onClick={handleGenerate}
              disabled={submitting || !form.goal.trim()}
              className="bg-white text-route-dark hover:bg-slate-100 font-bold px-8 py-3 rounded-xl text-base shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white"
            >
              {submitting ? "Generating your roadmap..." : "✨ Generate My Roadmap →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}