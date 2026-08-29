import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLearner, getCachedRoadmaps, saveCachedRoadmaps } from "../../context/LearnerContext.jsx";
import { updateProfile } from "../../api/profile.js";
import { getLearnerRoadmaps, updateLearnerAccount } from "../../api/learner.js";
import { replanRoadmap } from "../../api/roadmap.js";
import { getStyleInfo } from "../../utils/roadmap.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/Button.jsx";
import Toast from "../../components/Toast.jsx";

const GOAL_TYPE_LABELS = {
  job: { label: "Land a Job", icon: "💼" },
  internship: { label: "Internship", icon: "🎯" },
  career_transition: { label: "Career Switch", icon: "🔄" },
  new_skill: { label: "Learn a New Skill", icon: "🚀" },
  project: { label: "Build a Project", icon: "🛠️" },
  academic: { label: "Academic / Research", icon: "🔬" },
  certification: { label: "Certification Prep", icon: "📜" },
  interview_prep: { label: "Interview Prep", icon: "⚡" },
};

export default function SettingsView() {
  const {
    learnerId,
    learnerName,
    setLearnerName,
    profile,
    setProfile,
    profileId,
    roadmap,
    roadmapId,
    switchRoadmap,
    reloadRoadmap,
    logout,
    theme,
    setTheme,
  } = useLearner();

  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  // Goal & Schedule Form states
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goal, setGoal] = useState(profile?.target_role || profile?.goal || "Become an AI Engineer");
  const [weeklyHours, setWeeklyHours] = useState(profile?.weekly_time_hours || 10);
  const [timelineMonths, setTimelineMonths] = useState(profile?.timeline_months || 6);

  // Account Form states (Display Name & Password)
  const [displayName, setDisplayName] = useState(learnerName || "Learner");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    if (profile) {
      setGoal(profile.target_role || profile.goal || "Become an AI Engineer");
      setWeeklyHours(profile.weekly_time_hours || 10);
      setTimelineMonths(profile.timeline_months || 6);
    }
  }, [profile]);

  // All Roadmaps State
  const [roadmapsList, setRoadmapsList] = useState(() => getCachedRoadmaps(learnerId));
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [replanningId, setReplanningId] = useState(null);

  const fetchRoadmaps = async () => {
    if (!learnerId) return;
    setLoadingRoadmaps(true);
    let serverRoadmaps = [];
    try {
      const res = await getLearnerRoadmaps(learnerId);
      if (res.ok && res.data?.roadmaps && Array.isArray(res.data.roadmaps)) {
        serverRoadmaps = res.data.roadmaps;
      }
    } catch (err) {
      console.warn("Could not fetch remote roadmaps:", err);
    }
    setLoadingRoadmaps(false);

    // Merge server roadmaps with local cached roadmaps (keyed by profile ID so each goal is unique)
    const localCached = getCachedRoadmaps(learnerId);
    const mergedMap = new Map();

    // 1. Add server roadmaps
    serverRoadmaps.forEach((r) => {
      const key = r.learner_profile_id || r.id || r.roadmap_id;
      if (key) mergedMap.set(key, r);
    });

    // 2. Add local cached roadmaps only if not present on server
    localCached.forEach((r) => {
      const key = r.learner_profile_id || r.id || r.roadmap_id;
      if (key && !mergedMap.has(key)) {
        mergedMap.set(key, r);
      }
    });

    // 3. If still empty but active roadmap exists in context, synthesize an entry
    if (mergedMap.size === 0 && roadmap && roadmap.id) {
      const totalItems = (roadmap.items || []).length;
      const completedItems = (roadmap.items || []).filter(
        (it) => it.status === "completed" || it.status === "skipped"
      ).length;
      const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      const activeEntry = {
        id: roadmap.id,
        roadmap_id: roadmap.id,
        learner_profile_id: profileId || roadmap.learner_profile_id,
        goal: profile?.target_role || profile?.targetRole || profile?.goal || "Active Learning Pathway",
        goal_type: profile?.goal_type || "job",
        weekly_time_hours: profile?.weekly_time_hours || 10,
        timeline_months: profile?.timeline_months || 6,
        total_items: totalItems,
        completed_items: completedItems,
        total_hours: (roadmap.items || []).reduce((acc, it) => acc + (it.resource?.duration_hours || 4), 0),
        completed_hours: (roadmap.items || []).filter((it) => it.status === "completed" || it.status === "skipped").reduce((acc, it) => acc + (it.resource?.duration_hours || 4), 0),
        percentage: pct,
        is_completed: totalItems > 0 && completedItems === totalItems,
        version: roadmap.version || 1,
      };
      mergedMap.set(roadmap.id, activeEntry);
    }

    const finalList = Array.from(mergedMap.values());
    setRoadmapsList(finalList);
    if (finalList.length > 0) {
      saveCachedRoadmaps(learnerId, finalList);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [learnerId, roadmapId, roadmap]);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!profileId) {
      setToast({ message: "No active profile selected.", tone: "error" });
      return;
    }

    setSavingGoal(true);
    const updatedData = {
      ...profile,
      goal: goal.trim(),
      target_role: goal.trim(),
      weekly_time_hours: Number(weeklyHours),
      timeline_months: Number(timelineMonths),
    };

    const res = await updateProfile(profileId, updatedData);
    setSavingGoal(false);
    if (res.ok) {
      setProfile(res.data);
      setEditingGoal(false);
      setToast({ message: "Learning Goal & Schedule updated successfully!", tone: "success" });
      await fetchRoadmaps();
    } else {
      setToast({ message: "Could not update goal on server.", tone: "error" });
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setToast({ message: "Display name cannot be empty.", tone: "error" });
      return;
    }

    setSavingAccount(true);
    const payload = {
      name: displayName.trim(),
      password: newPassword.trim() ? newPassword.trim() : undefined,
    };

    const res = await updateLearnerAccount(learnerId, payload);
    setSavingAccount(false);
    if (res.ok) {
      setLearnerName(displayName.trim());
      setNewPassword("");
      setToast({ message: "Account details updated successfully!", tone: "success" });
    } else {
      setToast({ message: "Could not update account credentials.", tone: "error" });
    }
  };

  const handleSwitchRoadmap = async (targetRoadmap) => {
    if (targetRoadmap.id === roadmapId) {
      setToast({ message: "This pathway is already your active focus.", tone: "info" });
      return;
    }

    setToast({ message: `Switching to: "${targetRoadmap.goal}"...`, tone: "info" });
    const success = await switchRoadmap(targetRoadmap.id, targetRoadmap.learner_profile_id);
    if (success) {
      setToast({ message: `Active pathway changed to "${targetRoadmap.goal}" 🚀`, tone: "success" });
      fetchRoadmaps();
    } else {
      setToast({ message: "Could not switch roadmap.", tone: "error" });
    }
  };

  const handleReplanPathway = async (rId) => {
    setReplanningId(rId);
    setToast({ message: "Adapting pathway with your latest acquired skills & level...", tone: "info" });
    try {
      const res = await replanRoadmap(rId);
      setReplanningId(null);
      if (res.ok && res.data?.roadmap) {
        const newRoadmap = res.data.roadmap;
        if (res.data?.unchanged) {
          setToast({
            message: "Your roadmap is already up to date! Complete your pending modules to unlock subsequent milestones.",
            tone: "info",
          });
        } else {
          await switchRoadmap(newRoadmap.id, newRoadmap.learner_profile_id);
          await fetchRoadmaps();
          setToast({ message: "🎉 Pathway adapted and activated as your active focus!", tone: "success" });
        }
      } else {
        const errDetail = res.data?.detail?.detail || res.data?.detail || "Could not replan pathway.";
        setToast({ message: typeof errDetail === "string" ? errDetail : "Could not replan pathway.", tone: "error" });
      }
    } catch (err) {
      setReplanningId(null);
      console.error(err);
      setToast({ message: "Failed to adapt pathway.", tone: "error" });
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const varkScores = profile?.vark_scores || profile?.learning_style?.scores || {
    visual: 4,
    auditory: 2,
    read_write: 3,
    kinesthetic: 5,
  };
  const dominantStyle = profile?.dominant_style || profile?.learning_style?.dominant_style || "multimodal";
  const styleInfo = getStyleInfo(dominantStyle);

  return (
    <AppShell>
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-route-light dark:bg-route/20 text-route text-xs font-bold uppercase tracking-wider">
              Settings & Preferences
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Learning Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Manage your preserved curriculum pathways, customize your schedule, and update your account details.
            </p>
          </div>
        </div>

        {/* Multi-Roadmap Preserved Goals Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Your Learning Goals & Roadmaps
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All pathways you've created are preserved. Switch between them or adapt from where you left off anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/app/new-goal")}
              className="inline-flex items-center gap-1.5 bg-route hover:bg-route-dark text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              + Set New Learning Goal
            </button>
          </div>

          {loadingRoadmaps ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your pathways...</div>
          ) : roadmapsList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              No roadmaps found. Click "+ Set New Learning Goal" to create your first curriculum!
            </div>
          ) : (
            <div className="space-y-4">
              {roadmapsList.map((r) => {
                const isActive =
                  r.id === roadmapId ||
                  (profileId && r.learner_profile_id === profileId) ||
                  (roadmap?.learner_profile_id && r.learner_profile_id === roadmap.learner_profile_id);
                const isReplanning = replanningId === r.id;

                return (
                  <div
                    key={r.id}
                    className={`rounded-2xl border p-5 transition-all space-y-4 ${
                      isActive
                        ? "bg-slate-50/80 dark:bg-slate-800/40 border-route dark:border-route shadow-sm ring-1 ring-route/30"
                        : "bg-white dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isActive && (
                            <span className="text-[10px] bg-route text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              🎯 Active Focus
                            </span>
                          )}
                          <span className="text-[10px] bg-route-light/50 dark:bg-route/20 text-route px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
                            <span>{GOAL_TYPE_LABELS[r.goal_type]?.icon || "💼"}</span>
                            <span>{GOAL_TYPE_LABELS[r.goal_type]?.label || r.goal_type || "Career Goal"}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            v{r.version} · ⏱️ {r.timeline_months || 6}m · 🕐 {r.weekly_time_hours || 10}h/wk
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                          {r.target_role || r.goal}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSwitchRoadmap(r)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            ✓ Switch
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/app/roadmap/${r.id}`)}
                          className="inline-flex items-center gap-1 bg-route-light/80 dark:bg-route/20 hover:bg-route hover:text-white text-route text-xs font-bold px-3.5 py-2 rounded-xl border border-route/30 transition-all cursor-pointer shadow-2xs"
                        >
                          View Roadmap →
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplanPathway(r.id)}
                          disabled={isReplanning}
                          className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          {isReplanning ? "Adapting..." : "🔄 Replan"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Learning Goal & Schedule Edit Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Active Learning Goal & Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customizing focus and study dedication for your currently active pathway.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingGoal(!editingGoal)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto ${
                editingGoal
                  ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  : "bg-route text-white hover:bg-route-dark shadow-xs"
              }`}
            >
              {editingGoal ? "✕ Cancel Editing" : "✏️ Edit Goal & Schedule"}
            </button>
          </div>

          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target Role / Focus Goal
              </label>
              <textarea
                rows={2}
                disabled={!editingGoal}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-white disabled:opacity-80 resize-none focus:outline-none focus:ring-2 focus:ring-route/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Weekly Commitment (Hours/Week)
                </label>
                <input
                  type="number"
                  disabled={!editingGoal}
                  min={1}
                  max={40}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-route/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Target Timeline (Months)
                </label>
                <input
                  type="number"
                  disabled={!editingGoal}
                  min={1}
                  max={24}
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-route/30"
                />
              </div>
            </div>

            {editingGoal && (
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setEditingGoal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={savingGoal} className="text-xs font-bold">
                  {savingGoal ? "Saving Goal..." : "Save Goal & Schedule"}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Account Credentials Card (Display Name & Password) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Account Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your display name and update your account password.
            </p>
          </div>

          <form onSubmit={handleSaveAccount} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Change Password
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-route/30"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingAccount} className="text-xs font-bold">
                {savingAccount ? "Updating Account..." : "Save Account Details"}
              </Button>
            </div>
          </form>
        </div>

        {/* VARK Learning Modality */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Learning Modality (VARK)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assessed sensory preferences powering your recommendations</p>
            </div>
            <span className="text-xs font-bold text-route px-3 py-1.5 rounded-full bg-route-light/60 dark:bg-route/20 flex items-center gap-1.5">
              <span>{getStyleInfo(dominantStyle).icon}</span>
              <span>{getStyleInfo(dominantStyle).label}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(varkScores).map(([style, score]) => {
              const total = Object.values(varkScores).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((score / total) * 100);
              const icons = { visual: "👁️", auditory: "🎧", read_write: "📖", kinesthetic: "🛠️" };
              const names = { visual: "Visual", auditory: "Auditory", read_write: "Reading & Writing", kinesthetic: "Kinesthetic (Hands-on)" };

              return (
                <div key={style} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span>{icons[style] || "✨"}</span> {names[style] || style}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-route rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appearance Theme */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Appearance & UI Theme
          </h3>

          <div className="flex items-center gap-3">
            {["light", "system", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  theme === t
                    ? "bg-route text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone / Logout */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/60 p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="font-display font-bold text-lg text-rose-700 dark:text-rose-400">Account Session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Signing out will end your active session on this device. All your pathways remain preserved in your account.
          </p>

          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out of Pathwise
          </button>
        </div>
      </div>
    </AppShell>
  );
}
