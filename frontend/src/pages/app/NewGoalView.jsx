import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { createProfile } from "../../api/profile.js";
import { generateRoadmap } from "../../api/roadmap.js";
import { getLearnerRoadmaps } from "../../api/learner.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/Button.jsx";
import Toast from "../../components/Toast.jsx";

const LEARNER_ROLES = [
  { value: "Student", label: "Student / Academic" },
  { value: "Software Engineer", label: "Software Engineer / Developer" },
  { value: "Data Analyst", label: "Data Analyst / Data Scientist" },
  { value: "Working Professional", label: "Working Professional (Tech / Non-Tech)" },
  { value: "Job Seeker", label: "Job Seeker / Candidate" },
  { value: "Career Switcher", label: "Career Switcher" },
  { value: "Other", label: "Other" },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner — Starting from scratch / fundamentals" },
  { value: "intermediate", label: "Intermediate — Comfortable with programming & core concepts" },
  { value: "advanced", label: "Advanced — Experienced engineer seeking domain mastery" },
];

const GOAL_OBJECTIVES = [
  { value: "job", label: "🎯 Job Placement / Target Career Role" },
  { value: "career_transition", label: "🔄 Career Transition / Industry Switch" },
  { value: "internship", label: "💼 Internship Preparation" },
  { value: "new_skill", label: "⚡ Mastering a Specific Skill / Technology" },
  { value: "project", label: "🛠️ Building a Practical Portfolio / Production Project" },
  { value: "academic", label: "🎓 Academic Research / Higher Studies" },
  { value: "certification", label: "📜 Technical Certification" },
  { value: "interview_prep", label: "💡 Interview & Coding Assessment Prep" },
];

const TARGET_ROLE_OPTIONS_BY_GOAL_TYPE = {
  job: {
    label: "Target Role / Job Title",
    options: [
      "AI Engineer (LLMs & Agents)",
      "Machine Learning Engineer",
      "Data Scientist / Analytics Specialist",
      "Fullstack Developer (React & Node/Python)",
      "Backend Engineer (APIs & Microservices)",
      "Frontend Engineer (TypeScript & Next.js)",
      "Cloud & DevOps Engineer",
      "Software Engineer (Generalist)",
      "Other",
    ],
  },
  internship: {
    label: "Target Internship Role",
    options: [
      "AI / ML Research Intern",
      "Software Engineering Intern",
      "Data Science Intern",
      "Frontend / Web Development Intern",
      "Backend Development Intern",
      "DevOps & Infrastructure Intern",
      "Computer Vision / NLP Intern",
      "Other",
    ],
  },
  career_transition: {
    label: "Target Transition Field / Role",
    options: [
      "Transition to AI / ML Engineering",
      "Transition to Fullstack Web Development",
      "Transition to Data Science & Analytics",
      "Transition to Cloud & DevOps Engineering",
      "Transition from Non-Tech to Software Engineering",
      "Transition to Technical Product / Solutions Engineering",
      "Other",
    ],
  },
  new_skill: {
    label: "Target Skill / Technology Stack",
    options: [
      "Generative AI, LangChain & LLM Chatbots",
      "Deep Learning & Neural Networks (PyTorch/TensorFlow)",
      "React, Next.js & Modern Frontend Architecture",
      "FastAPI, Python Microservices & Async APIs",
      "Docker, Kubernetes & Containerization",
      "SQL, Data Modeling & PostgreSQL",
      "TypeScript & Scalable Clean Code",
      "Other",
    ],
  },
  project: {
    label: "Project Type / Practical Focus",
    options: [
      "Autonomous AI Agent / Multi-Agent Workflow",
      "Production RAG (Retrieval-Augmented Generation) System",
      "Fullstack SaaS Web Application with Auth & Payments",
      "End-to-End ML Pipeline with Model Deployment",
      "Real-Time Collaborative Platform",
      "Computer Vision / Image Processing System",
      "Personal Portfolio & Capstone Projects",
      "Other",
    ],
  },
  academic: {
    label: "Research Domain / Academic Topic",
    options: [
      "Natural Language Processing (NLP) & Transformers",
      "Deep Learning & Computer Vision Research",
      "Reinforcement Learning & Autonomous Systems",
      "Statistical Machine Learning & Optimization Theory",
      "AI Ethics, Interpretability & Alignment",
      "Master's / PhD Thesis Preparation",
      "Other",
    ],
  },
  certification: {
    label: "Target Certification",
    options: [
      "AWS Certified Machine Learning - Specialty",
      "AWS Certified Solutions Architect / Cloud Practitioner",
      "Google Cloud Professional Machine Learning Engineer",
      "Google Cloud Professional Data Engineer",
      "Microsoft Certified: Azure AI Engineer Associate",
      "TensorFlow Developer Certificate",
      "Meta Frontend / Backend Professional Certificate",
      "CKA (Certified Kubernetes Administrator)",
      "Other",
    ],
  },
  interview_prep: {
    label: "Interview Preparation Track",
    options: [
      "Data Structures, Algorithms & LeetCode (Python/Java/JS)",
      "System Design & High-Scalability Architecture",
      "Machine Learning & AI Technical Screen Prep",
      "Fullstack & Backend Coding Interviews",
      "Behavioral & Engineering Leadership Rounds",
      "Other",
    ],
  },
};

export default function NewGoalView() {
  const { learnerId, profile, setProfile, setProfileId, setRoadmap, setRoadmapId } = useLearner();
  const navigate = useNavigate();

  const [currentRole, setCurrentRole] = useState(profile?.current_role || "Student");
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || "intermediate");
  const [goalType, setGoalType] = useState(profile?.goal_type || "job");
  
  const roleConfig = TARGET_ROLE_OPTIONS_BY_GOAL_TYPE[goalType] || TARGET_ROLE_OPTIONS_BY_GOAL_TYPE.job;
  const [targetFocus, setTargetFocus] = useState(roleConfig.options[0]);
  const [isCustomFocus, setIsCustomFocus] = useState(false);
  const [customFocusText, setCustomFocusText] = useState("");

  const [goal, setGoal] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(profile?.weekly_time_hours || 10);
  const [timelineMonths, setTimelineMonths] = useState(profile?.timeline_months || 6);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const effectiveTargetFocus = isCustomFocus ? (customFocusText || targetFocus) : targetFocus;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveRoleName = effectiveTargetFocus || goal.trim() || "Career Pathway";

    const effectiveLearnerId = learnerId || profile?.learner_id;
    if (!effectiveLearnerId) {
      setToast({ message: "Session expired. Please log in again.", tone: "error" });
      navigate("/login");
      return;
    }

    setLoading(true);
    setToast({ message: "Checking your existing pathways...", tone: "info" });

    try {
      // Prevent duplicate pathways: check if learner already has a roadmap for this goal
      const existingRes = await getLearnerRoadmaps(effectiveLearnerId);
      if (existingRes.ok && Array.isArray(existingRes.data?.roadmaps)) {
        const normalizedTarget = effectiveRoleName.trim().toLowerCase();
        const existingDuplicate = existingRes.data.roadmaps.find(
          (r) => (r.target_role || r.goal || "").trim().toLowerCase() === normalizedTarget
        );

        if (existingDuplicate) {
          setLoading(false);
          setToast({
            message: `You already have an active curriculum for "${effectiveRoleName}". Switched to your existing pathway!`,
            tone: "info",
          });
          await switchRoadmap(existingDuplicate.id, existingDuplicate.learner_profile_id);
          setTimeout(() => {
            navigate("/app/home");
          }, 1200);
          return;
        }
      }

      setToast({ message: "Synthesizing your new personalized curriculum pathway...", tone: "info" });

      const profilePayload = {
        goal: effectiveRoleName,
        goal_type: goalType,
        experience_level: experienceLevel,
        current_role: currentRole,
        target_role: effectiveRoleName,
        current_skills: profile?.current_skills || ["Python", "Git"],
        interests: profile?.interests || ["AI & Machine Learning", "Software Development"],
        timeline_months: Number(timelineMonths) || 6,
        weekly_time_hours: Number(weeklyHours) || 10,
        constraints: goal.trim() ? [goal.trim()] : [],
        learning_style: profile?.learning_style || {
          dominant_style: profile?.dominant_style || "multimodal",
          scores: profile?.vark_scores || { visual: 25, auditory: 25, read_write: 25, kinesthetic: 25 },
        },
      };

      const profRes = await createProfile(effectiveLearnerId, profilePayload);
      if (!profRes.ok || !profRes.data?.profile) {
        throw new Error("Could not save new learning profile.");
      }

      const newProfile = profRes.data.profile;
      setProfile(newProfile);
      if (setProfileId) setProfileId(newProfile.id);

      const roadmapRes = await generateRoadmap(newProfile.id);
      setLoading(false);

      if (roadmapRes.ok && roadmapRes.data?.roadmap) {
        const newRoadmap = roadmapRes.data.roadmap;
        setRoadmap(newRoadmap);
        if (setRoadmapId) setRoadmapId(newRoadmap.id);

        const storageKey = `unlocked_week_${newRoadmap.id}`;
        try {
          localStorage.setItem(storageKey, "0");
        } catch {
          // ignore
        }

        setToast({ message: "🎉 New curriculum pathway created successfully!", tone: "success" });
        setTimeout(() => {
          navigate("/app/home");
        }, 600);
      } else {
        setToast({ message: "Could not generate roadmap for this goal.", tone: "error" });
      }
    } catch (err) {
      setLoading(false);
      console.error("New goal error:", err);
      setToast({ message: err.message || "Failed to create new pathway.", tone: "error" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate("/app/home")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-route transition-colors cursor-pointer"
        >
          ← Back to Dashboard
        </button>

        {/* Card Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-route-light dark:bg-route/20 text-route text-xs font-bold uppercase tracking-wider">
            Pathway Generator
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Set a New Learning Goal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Configure your next target specialization. Your existing profile preferences and learning style are automatically preserved.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Current Role / Learner Status Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Current Role / Status
            </label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route cursor-pointer transition-all"
            >
              {LEARNER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Overall Experience Level Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Overall Tech Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route cursor-pointer transition-all"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Objective Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Primary Goal Objective
            </label>
            <select
              value={goalType}
              onChange={(e) => {
                const newGt = e.target.value;
                setGoalType(newGt);
                const nextCfg = TARGET_ROLE_OPTIONS_BY_GOAL_TYPE[newGt];
                if (nextCfg && nextCfg.options.length > 0) {
                  setTargetFocus(nextCfg.options[0]);
                  setIsCustomFocus(false);
                  setCustomFocusText("");
                }
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route cursor-pointer transition-all"
            >
              {GOAL_OBJECTIVES.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Role / Focus Dropdown & Custom Option */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {roleConfig.label}
            </label>
            <select
              value={isCustomFocus ? "Other" : (roleConfig.options.includes(targetFocus) ? targetFocus : "Other")}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "Other") {
                  setIsCustomFocus(true);
                  if (!customFocusText) {
                    setTargetFocus("");
                  } else {
                    setTargetFocus(customFocusText);
                  }
                } else {
                  setIsCustomFocus(false);
                  setTargetFocus(val);
                }
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route cursor-pointer transition-all"
            >
              {roleConfig.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {(isCustomFocus || !roleConfig.options.includes(targetFocus)) && (
              <input
                type="text"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route animate-in fade-in duration-150"
                placeholder={`Type your custom ${roleConfig.label.toLowerCase()}...`}
                value={customFocusText || targetFocus}
                onChange={(e) => {
                  setCustomFocusText(e.target.value);
                  setTargetFocus(e.target.value);
                }}
              />
            )}
          </div>

          {/* Target Goal Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Specific Goal Details & Topics (Optional)
            </label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={`e.g., I want to master ${effectiveTargetFocus || 'this subject'} and build production-ready projects.`}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-route resize-none transition-all"
            />
          </div>

          {/* Weekly Commitment & Timeline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">Weekly Commitment</span>
                <span className="text-route font-extrabold">{weeklyHours} hours/week</span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-route cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>3h (Casual)</span>
                <span>10h (Standard)</span>
                <span>30h (Intensive)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Timeline</span>
                <span className="text-route font-extrabold">{timelineMonths} months</span>
              </div>
              <input
                type="range"
                min={1}
                max={18}
                step={1}
                value={timelineMonths}
                onChange={(e) => setTimelineMonths(Number(e.target.value))}
                className="w-full accent-route cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>1 mo (Sprint)</span>
                <span>6 mo (Balanced)</span>
                <span>18 mo (Comprehensive)</span>
              </div>
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/app/home")}
              className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg"
            >
              {loading ? "⚡ Generating Your Pathway..." : "🚀 Generate New Curriculum Pathway →"}
            </Button>
          </div>
        </form>

        <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
