import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { calculateProgress, getWeeklyGoalAndPlan } from "../../utils/roadmap.js";
import { explainItem, sendFeedback, replanRoadmap, generateRoadmap } from "../../api/roadmap.js";
import { createProfile } from "../../api/profile.js";
import AppShell from "../../components/layout/AppShell.jsx";
import WhyRecommendedModal from "../../components/modals/WhyRecommendedModal.jsx";
import SkipItemModal from "../../components/modals/SkipItemModal.jsx";
import Toast from "../../components/Toast.jsx";
import Button from "../../components/Button.jsx";

const TYPE_ICONS = {
  course: "🎓",
  article: "📄",
  video: "🎥",
  project: "🛠️",
  assessment: "📝",
  book: "📚",
};

export default function HomeDashboard() {
  const { roadmap, setRoadmap, setRoadmapId, profile, setProfile, setProfileId, reloadRoadmap, roadmapId, learnerId, profileId, learnerName, setSelectedItem } = useLearner();
  const navigate = useNavigate();

  const [levelingUp, setLevelingUp] = useState(false);

  // Storage key to remember highest unlocked week per roadmap
  const storageKey = roadmapId ? `unlocked_week_${roadmapId}` : "unlocked_week_default";
  const [unlockedWeekMax, setUnlockedWeekMax] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });

  const updateUnlockedWeek = (val) => {
    setUnlockedWeekMax(val);
    try {
      localStorage.setItem(storageKey, String(val));
    } catch (e) {
      // ignore
    }
  };

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
  const [weekCompletedModal, setWeekCompletedModal] = useState(null);
  const [dismissedCelebrationWeeks, setDismissedCelebrationWeeks] = useState([]);

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyTitle, setWhyTitle] = useState("");
  const [whyExplanation, setWhyExplanation] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);

  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [activeItemToSkip, setActiveItemToSkip] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const stats = calculateProgress(roadmap);
  const weeklyPlan = getWeeklyGoalAndPlan(roadmap, profile?.weekly_time_hours || 10, selectedWeekIndex, unlockedWeekMax);

  // Trigger celebration popup whenever current week needs unlock
  useEffect(() => {
    if (
      weeklyPlan.assignedItems.length > 0 &&
      weeklyPlan.needsUnlockNext &&
      !dismissedCelebrationWeeks.includes(weeklyPlan.weekNumber)
    ) {
      setWeekCompletedModal({
        weekNumber: weeklyPlan.weekNumber,
        totalWeekHours: weeklyPlan.totalWeekHours,
        nextWeekNumber: weeklyPlan.nextWeekNumber,
        weekIndex: weeklyPlan.weekIndex,
        hasMoreWeeks: weeklyPlan.hasMoreWeeks,
      });
    }
  }, [
    weeklyPlan.needsUnlockNext,
    weeklyPlan.weekNumber,
    weeklyPlan.weekIndex,
    weeklyPlan.assignedItems.length,
    dismissedCelebrationWeeks,
  ]);

  const handleUnlockWeek = async (targetWeekIdx) => {
    updateUnlockedWeek(targetWeekIdx);
    setSelectedWeekIndex(targetWeekIdx);
    setWeekCompletedModal(null);
    if (roadmapId) {
      setToast({ message: "Adapting roadmap for your upcoming week...", tone: "info" });
      const res = await replanRoadmap(roadmapId);
      if (res.ok && res.data?.roadmap) {
        const newRoadmap = res.data.roadmap;
        await switchRoadmap(newRoadmap.id, newRoadmap.learner_profile_id);
        setToast({ message: `Week ${targetWeekIdx + 1} unlocked! Roadmap updated 🚀`, tone: "success" });
      }
    }
  };

  const handleUnlockNextWeek = async () => {
    if (!weekCompletedModal) return;
    const nextWeekIdx = weekCompletedModal.weekIndex + 1;
    const finishedWeekNum = weekCompletedModal.weekNumber;

    setDismissedCelebrationWeeks((prev) => [...prev, finishedWeekNum]);
    await handleUnlockWeek(nextWeekIdx);
  };

  const handleLevelUpRoadmap = async () => {
    const effectiveLearnerId = learnerId || profile?.learner_id;
    if (!effectiveLearnerId) {
      setToast({ message: "Learner session not found. Please log in.", tone: "error" });
      return;
    }

    setLevelingUp(true);
    setToast({ message: "Leveling up your profile and synthesizing advanced curriculum...", tone: "info" });

    try {
      const currentLevel = (profile?.experience_level || "beginner").toLowerCase();
      const nextLevel = currentLevel === "beginner" ? "intermediate" : "advanced";

      const updatedProfilePayload = {
        goal: profile?.goal || "AI Engineering & Advanced Specializations",
        goal_type: profile?.goal_type || "career_transition",
        experience_level: nextLevel,
        current_skills: profile?.current_skills || ["Python", "Machine Learning", "Neural Networks"],
        interests: profile?.interests || ["AI & Machine Learning", "Deep Learning", "LLMs"],
        timeline_months: profile?.timeline_months || 6,
        weekly_time_hours: profile?.weekly_time_hours || 10,
        constraints: profile?.constraints || [],
        learning_style: profile?.learning_style || {
          dominant_style: profile?.dominant_style || "multimodal",
          scores: profile?.vark_scores || { visual: 25, auditory: 25, read_write: 25, kinesthetic: 25 },
        },
      };

      const profRes = await createProfile(effectiveLearnerId, updatedProfilePayload);
      if (!profRes.ok || !profRes.data?.profile) {
        throw new Error("Could not create upgraded profile.");
      }

      const newProfile = profRes.data.profile;
      setProfile(newProfile);
      if (setProfileId) setProfileId(newProfile.id);

      const roadmapRes = await generateRoadmap(newProfile.id);
      setLevelingUp(false);

      if (roadmapRes.ok && roadmapRes.data?.roadmap) {
        const newRoadmap = roadmapRes.data.roadmap;
        setRoadmap(newRoadmap);
        if (setRoadmapId) setRoadmapId(newRoadmap.id);

        const newKey = `unlocked_week_${newRoadmap.id}`;
        try {
          localStorage.setItem(newKey, "0");
        } catch {
          // ignore
        }
        setUnlockedWeekMax(0);
        setSelectedWeekIndex(0);
        setToast({
          message: `🎉 Level-Up Complete! Advanced (${nextLevel}) pathway generated with new modules. Starting Week 1!`,
          tone: "success",
        });
      } else {
        setToast({ message: "Could not generate advanced roadmap.", tone: "error" });
      }
    } catch (err) {
      setLevelingUp(false);
      console.error("Level up error:", err);
      setToast({ message: "Could not level up roadmap. Please try again.", tone: "error" });
    }
  };

  const handleWhyRecommended = async (item) => {
    setWhyTitle(item.resource?.title || "Item");
    setWhyOpen(true);
    setWhyLoading(true);
    setWhyExplanation("");

    if (roadmapId && item.id) {
      const res = await explainItem(roadmapId, item.id);
      setWhyLoading(false);
      if (res.ok) {
        setWhyExplanation(res.data.explanation);
      } else {
        setWhyExplanation("Could not fetch explanation from AI recommender.");
      }
    } else {
      setWhyLoading(false);
      setWhyExplanation("This resource directly addresses key prerequisites for your learning goals.");
    }
  };

  const handleComplete = async (item) => {
    if (!roadmapId) return;
    const isFinishingWeek = weeklyPlan.assignedItems.filter(
      (it) => it.id !== item.id && it.status !== "completed" && it.status !== "skipped"
    ).length === 0;

    setSelectedWeekIndex(weeklyPlan.weekIndex);
    const res = await sendFeedback(roadmapId, item.id, "complete");
    if (res.ok) {
      setToast({ message: `Marked "${item.resource?.title}" as complete!`, tone: "success" });
      if (isFinishingWeek) {
        setWeekCompletedModal({
          weekNumber: weeklyPlan.weekNumber,
          totalWeekHours: weeklyPlan.totalWeekHours,
          nextWeekNumber: weeklyPlan.nextWeekNumber,
          weekIndex: weeklyPlan.weekIndex,
          hasMoreWeeks: weeklyPlan.hasMoreWeeks,
        });
      }
      await reloadRoadmap();
    } else {
      setToast({ message: "Could not record completion. Please try again.", tone: "error" });
    }
  };

  const handleOpenSkip = (item) => {
    setActiveItemToSkip(item);
    setSkipModalOpen(true);
  };

  const handleConfirmSkip = async (reasonNote) => {
    if (!roadmapId || !activeItemToSkip) return;
    setSelectedWeekIndex(weeklyPlan.weekIndex);
    setSkipLoading(true);
    const res = await sendFeedback(roadmapId, activeItemToSkip.id, "skip", reasonNote);
    setSkipLoading(false);
    setSkipModalOpen(false);

    if (res.ok) {
      setToast({ message: `Skipped "${activeItemToSkip.resource?.title}".`, tone: "info" });
      await reloadRoadmap();
    } else {
      setToast({ message: "Could not skip item.", tone: "error" });
    }
  };

  const handleOpenDetail = (item) => {
    if (item.isLocked || weeklyPlan.isWeekLocked) {
      setToast({
        message: `Week ${weeklyPlan.weekNumber} is locked. Complete previous week modules first!`,
        tone: "info",
      });
      return;
    }
    setSelectedItem(item);
    navigate(`/app/roadmap/${roadmapId || "current"}/item/${item.id}`);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-route-dark via-route to-[#3a8b75] rounded-3xl p-6 sm:p-8 text-white shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold uppercase tracking-wider">
                Daily Learning Hub
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">
                Welcome back, {learnerName || "Learner"} 👋
              </h1>
              <p className="text-white/80 text-sm max-w-xl">
                Continue your customized pathway towards{" "}
                <strong className="text-white font-semibold">
                  {profile?.target_role || profile?.targetRole || profile?.goal || "AI Engineer"}
                </strong>
                . Here is what you should focus on today!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[140px]">
              <p className="text-3xl font-bold font-display">{stats.percentage}%</p>
              <p className="text-xs text-white/70 mt-0.5">Overall Path Complete</p>
            </div>
          </div>
        </div>

        {/* 100% Roadmap Completion Milestone Level-Up Card */}
        {stats.percentage === 100 && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0 shadow-xs">
                  🏆
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                      Curriculum Complete
                    </span>
                    <span className="text-xs text-emerald-100 font-semibold">100% Mastered</span>
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                    Congratulations! You Mastered Your Entire Pathway!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-2xl">
                    You have finished all {stats.total} modules and completed {stats.completedHours} hours towards "{profile?.target_role || profile?.targetRole || profile?.goal || "AI Engineering"}". Ready to elevate your skills with advanced specializations?
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleLevelUpRoadmap}
                  disabled={levelingUp}
                  className="w-full sm:w-auto bg-white text-emerald-950 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {levelingUp ? "⚡ Generating Next Pathway..." : "🚀 Level Up & Generate Advanced Roadmap →"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/app/new-goal")}
                  className="w-full sm:w-auto bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer whitespace-nowrap"
                >
                  🎯 Set New Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real Stats Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hours Completed</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.completedHours}h</p>
            <p className="text-[11px] text-slate-500 mt-0.5">of {stats.totalHours}h estimated</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Modules Finished</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">of {stats.total} total modules</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.remaining}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">activities to complete</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Commitment</p>
            <p className="text-2xl font-bold text-route mt-1">{profile?.weekly_time_hours || 10}h</p>
            <p className="text-[11px] text-slate-500 mt-0.5">weekly allocation</p>
          </div>
        </div>

        {/* SECTION: THIS WEEK'S GOAL & ACTION PLAN */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                This Week's Goal & Action Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Curated modules scaled precisely to your {weeklyPlan.weeklyBudgetHours}h weekly commitment.
              </p>
            </div>

            {/* Compact Week Navigation Dropdown & Buttons */}
            {weeklyPlan.totalWeeks > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={weeklyPlan.weekIndex <= 0}
                  onClick={() => setSelectedWeekIndex(weeklyPlan.weekIndex - 1)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  ← Prev
                </button>

                <select
                  value={weeklyPlan.weekIndex}
                  onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-route/30 cursor-pointer shadow-2xs"
                >
                  {weeklyPlan.allWeeks.map((w, idx) => {
                    return (
                      <option key={idx} value={idx}>
                        Week {idx + 1} of {weeklyPlan.totalWeeks} {w.isCompleted ? "(Done ✓)" : w.isLocked ? "(Locked 🔒)" : "(Current 🎯)"}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  disabled={weeklyPlan.weekIndex >= weeklyPlan.totalWeeks - 1}
                  onClick={() => setSelectedWeekIndex(weeklyPlan.weekIndex + 1)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Weekly Progress Bar Meter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200">
                  Weekly Completion: {weeklyPlan.completedItems.length} of {weeklyPlan.assignedItems.length} modules
                </span>
                <span className="text-route">
                  {weeklyPlan.completedWeekHours}h / {weeklyPlan.totalWeekHours}h finished ({weeklyPlan.totalWeekHours > 0 ? Math.round((weeklyPlan.completedWeekHours / weeklyPlan.totalWeekHours) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-route transition-all duration-300"
                  style={{
                    width: `${weeklyPlan.totalWeekHours > 0 ? Math.min(100, Math.round((weeklyPlan.completedWeekHours / weeklyPlan.totalWeekHours) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => navigate("/app/roadmap")}
              className="text-xs font-semibold text-route hover:underline shrink-0"
            >
              View Full Roadmap →
            </button>
          </div>

          {/* Top banner when viewing a completed week */}
          {weeklyPlan.isWeekCompleted && weeklyPlan.hasMoreWeeks && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">🎉</span>
                <div>
                  <h4 className="font-bold text-sm">Week {weeklyPlan.weekNumber} Complete!</h4>
                  <p className="text-xs text-white/90">
                    You have finished all courses for this week. Ready to start Week {weeklyPlan.nextWeekNumber}?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnlockWeek(weeklyPlan.weekIndex + 1)}
                className="shrink-0 bg-white text-emerald-950 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                🚀 Unlock Week {weeklyPlan.nextWeekNumber} Modules →
              </button>
            </div>
          )}

          {/* Top banner when viewing a locked week preview */}
          {weeklyPlan.isWeekLocked && (
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">🔒</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                    Week {weeklyPlan.weekNumber} Curriculum Preview
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {weeklyPlan.weekIndex === 0 || weeklyPlan.allWeeks[weeklyPlan.weekIndex - 1]?.isCompleted
                      ? `Week ${weeklyPlan.weekIndex} is complete! You can unlock and start Week ${weeklyPlan.weekNumber} now.`
                      : `Complete all courses in Week ${weeklyPlan.weekIndex} first to unlock these modules.`}
                  </p>
                </div>
              </div>
              {(weeklyPlan.weekIndex === 0 || weeklyPlan.allWeeks[weeklyPlan.weekIndex - 1]?.isCompleted) && (
                <button
                  type="button"
                  onClick={() => handleUnlockWeek(weeklyPlan.weekIndex)}
                  className="shrink-0 bg-route hover:bg-route-dark active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  🚀 Unlock Week {weeklyPlan.weekNumber} Modules Now →
                </button>
              )}
            </div>
          )}

          {weeklyPlan.assignedItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
              <span className="text-3xl">🎉</span>
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">You are all caught up for this week!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                You've finished all scheduled courses. Explore supplementary resources or review your completed topics.
              </p>
              <Button onClick={() => navigate("/app/explore")} className="mt-2 text-xs">
                Explore More Resources →
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyPlan.assignedItems.map((item, index) => {
                const isItemDone = item.status === "completed" || item.status === "skipped";
                const isLocked = weeklyPlan.isWeekLocked || item.isLocked;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isLocked && handleOpenDetail(item)}
                    className={`rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isLocked
                        ? "bg-slate-50/70 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed"
                        : isItemDone
                        ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-route/50 hover:shadow-md cursor-pointer group"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-route hover:shadow-md cursor-pointer group"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isLocked
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                              : isItemDone
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : index === 0
                              ? "bg-route-light dark:bg-route/20 text-route font-bold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {isLocked
                            ? "🔒 Locked Module"
                            : isItemDone
                            ? "✓ Completed"
                            : index === 0
                            ? "🎯 Week Priority"
                            : `Course ${index + 1}`}
                        </span>
                        <span className="text-xs text-slate-400">
                          {TYPE_ICONS[item.resource?.type] || "📄"} {item.resource?.duration_hours}h
                        </span>
                      </div>

                      <h3
                        className={`font-bold text-base line-clamp-2 ${
                          isLocked
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-slate-800 dark:text-white group-hover:text-route transition-colors"
                        }`}
                      >
                        {item.resource?.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.resource?.description || "Curated module aligned with your learning pathway."}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium capitalize">
                          {item.resource?.level}
                        </span>
                        {item.resource?.domain && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium capitalize">
                            {item.resource.domain.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {isLocked ? (
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                          🔒 Locked
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhyRecommended(item);
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          Why this?
                        </button>
                      </div>
                    ) : isItemDone ? (
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          ✓ Done
                        </span>
                      </div>
                    ) : (
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhyRecommended(item);
                          }}
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                        >
                          Why this?
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                          className="text-xs font-bold text-route hover:bg-route-light/60 dark:hover:bg-route/20 px-3.5 py-1.5 rounded-xl border border-route/25 transition-colors inline-flex items-center gap-1"
                        >
                          Open →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Celebratory Week Completion Popup Modal */}
        {weekCompletedModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-3xl flex items-center justify-center mx-auto shadow-xs">
                🎉
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Congratulations!
                </h3>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  You've finished all of Week {weekCompletedModal.weekNumber}'s courses!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  You completed {weekCompletedModal.totalWeekHours} hours of coursework ahead of schedule. Keep your momentum going!
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                {weekCompletedModal.hasMoreWeeks ? (
                  <button
                    type="button"
                    onClick={handleUnlockNextWeek}
                    className="w-full bg-gradient-to-r from-route to-route-dark text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    🚀 Ready for Next Week? Unlock Week {weekCompletedModal.nextWeekNumber} Modules →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedCelebrationWeeks((prev) => [...prev, weekCompletedModal.weekNumber]);
                      setWeekCompletedModal(null);
                    }}
                    className="w-full bg-route text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md cursor-pointer"
                  >
                    🎓 View Completed Pathway
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDismissedCelebrationWeeks((prev) => [...prev, weekCompletedModal.weekNumber]);
                    setWeekCompletedModal(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Stay & Review This Week
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals & Toast */}
        <WhyRecommendedModal
          open={whyOpen}
          onClose={() => setWhyOpen(false)}
          title={whyTitle}
          explanation={whyExplanation}
          loading={whyLoading}
        />

        <SkipItemModal
          open={skipModalOpen}
          onClose={() => setSkipModalOpen(false)}
          onConfirm={handleConfirmSkip}
          title={activeItemToSkip?.resource?.title}
          loading={skipLoading}
        />

        <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
