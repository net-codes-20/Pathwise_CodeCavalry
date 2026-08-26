import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { calculateProgress, groupRoadmapPhases } from "../../utils/roadmap.js";
import { explainItem, sendFeedback, replanRoadmap, getRoadmap } from "../../api/roadmap.js";
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

export default function RoadmapView() {
  const { roadmapId: paramId } = useParams();
  const { roadmap, setRoadmap, profile, roadmapId, setRoadmapId, reloadRoadmap, setSelectedItem } = useLearner();
  const navigate = useNavigate();

  const [activeRoadmap, setActiveRoadmap] = useState(roadmap);
  const [loading, setLoading] = useState(!roadmap);
  const [replanning, setReplanning] = useState(false);
  const [replanChanges, setReplanChanges] = useState(null);

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyTitle, setWhyTitle] = useState("");
  const [whyExplanation, setWhyExplanation] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);

  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [activeItemToSkip, setActiveItemToSkip] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const effectiveId = paramId || roadmapId || roadmap?.id;

  useEffect(() => {
    if (effectiveId && (!roadmap || roadmap.id !== effectiveId)) {
      setLoading(true);
      getRoadmap(effectiveId).then((res) => {
        setLoading(false);
        if (res.ok) {
          setActiveRoadmap(res.data);
          setRoadmap(res.data);
          setRoadmapId(res.data.id);
        }
      });
    } else {
      setActiveRoadmap(roadmap);
      setLoading(false);
    }
  }, [effectiveId, roadmap, setRoadmap, setRoadmapId]);

  const stats = calculateProgress(activeRoadmap);
  const phases = groupRoadmapPhases(activeRoadmap);

  const handleWhyThis = async (item) => {
    setWhyTitle(item.resource?.title || "Topic");
    setWhyOpen(true);
    setWhyLoading(true);
    setWhyExplanation("");

    if (effectiveId && item.id) {
      const res = await explainItem(effectiveId, item.id);
      setWhyLoading(false);
      if (res.ok) {
        setWhyExplanation(res.data.explanation);
      } else {
        setWhyExplanation("Could not load why this item was recommended.");
      }
    } else {
      setWhyLoading(false);
      setWhyExplanation("Recommended as a core milestone for your profile.");
    }
  };

  const handleAction = async (item, action, note = "") => {
    if (!effectiveId) return;
    const res = await sendFeedback(effectiveId, item.id, action, note);
    if (!res.ok) {
      setToast({ message: "Could not update status.", tone: "error" });
      return;
    }

    setToast({
      message: action === "complete" ? "✅ Marked as complete!" : "⏭ Item skipped.",
      tone: "success",
    });

    await reloadRoadmap();

    // If replan recommended by backend
    if (res.data?.replan_recommended) {
      setToast({ message: "Adaptation recommended. Updating roadmap...", tone: "info" });
      handleReplan();
    }
  };

  const handleReplan = async () => {
    if (!effectiveId) return;
    setReplanning(true);
    const res = await replanRoadmap(effectiveId);
    setReplanning(false);

    if (res.ok && res.data?.roadmap) {
      setActiveRoadmap(res.data.roadmap);
      setRoadmap(res.data.roadmap);
      setRoadmapId(res.data.roadmap.id);
      setReplanChanges(res.data.changes_summary);
      setToast({ message: "Roadmap successfully updated & replanned!", tone: "success" });
    } else {
      setToast({ message: "Could not replan roadmap.", tone: "error" });
    }
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    navigate(`/app/roadmap/${effectiveId}/item/${item.id}`);
  };

  const handleOpenSkip = (item) => {
    setActiveItemToSkip(item);
    setSkipModalOpen(true);
  };

  const handleConfirmSkip = async (reasonNote) => {
    if (!activeItemToSkip) return;
    setSkipLoading(true);
    await handleAction(activeItemToSkip, "skip", reasonNote);
    setSkipLoading(false);
    setSkipModalOpen(false);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Roadmap Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-route-light text-route text-xs font-bold uppercase tracking-wider">
                Full Curriculum Roadmap
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                {profile?.target_role || profile?.targetRole || profile?.goal || "AI & Software Engineering Path"}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span>⏱️ {profile?.timeline_months || 6} Months</span>
                <span>•</span>
                <span>📚 {stats.total} Total Modules</span>
                <span>•</span>
                <span>🔥 {stats.completed} Completed ({stats.percentage}%)</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Overall Roadmap Completion</span>
              <span className="text-route font-bold">{stats.percentage}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-route to-[#4a9b82] rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Replan notice if recently adapted */}
        {replanChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-bold text-sm">Roadmap Adapted & Updated</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">{replanChanges}</p>
              </div>
            </div>
            <button
              onClick={() => setReplanChanges(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        )}

        {/* Vertical Timeline with Phases */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your roadmap curriculum...</div>
        ) : phases.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <span className="text-4xl">🗺️</span>
            <h3 className="font-bold text-lg text-slate-800">No roadmap items generated yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please complete onboarding or generate a new roadmap from your profile summary.
            </p>
            <Button onClick={() => navigate("/onboarding")} className="text-xs">
              Go to Onboarding →
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {phases.map((phase, pIdx) => (
              <div key={phase.id} className="space-y-4">
                {/* Phase Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      phase.isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : phase.hasCurrent
                        ? "bg-route text-white shadow-xs"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {phase.isCompleted ? "✓" : pIdx + 1}
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-800 uppercase tracking-wide">
                    {phase.name}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">({phase.items.length} items)</span>
                </div>

                {/* Phase Items List */}
                <div className="space-y-3 pl-4 border-l-2 border-slate-200 ml-4">
                  {phase.items.map((item) => {
                    const isCompleted = item.status === "completed";
                    const isSkipped = item.status === "skipped";
                    const isCurrent = item.status === "current" || item.status === "in_progress";

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-5 transition-all ${
                          isCompleted
                            ? "bg-slate-50 border-slate-200 opacity-80 dark:bg-slate-800/50 dark:border-slate-700/60"
                            : isSkipped
                            ? "bg-slate-50 border-slate-200 opacity-60 dark:bg-slate-900/40 dark:border-slate-800"
                            : isCurrent
                            ? "bg-white border-route ring-2 ring-route/15 shadow-xs dark:bg-slate-800 dark:border-route dark:ring-route/30"
                            : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.milestone && (
                                <span
                                  className="text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-500/10 dark:bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 dark:border-emerald-400/25 inline-flex items-center gap-1"
                                  title="Milestone"
                                >
                                  ⭐ Milestone
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isCompleted
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border dark:border-emerald-800"
                                    : isSkipped
                                    ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                    : isCurrent
                                    ? "bg-route text-white"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {isCompleted
                                  ? "Completed"
                                  : isSkipped
                                  ? "Skipped"
                                  : isCurrent
                                  ? "In Progress"
                                  : "Upcoming"}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {TYPE_ICONS[item.resource?.type] || "📄"} {item.resource?.type} ·{" "}
                                ⏱️ {item.resource?.duration_hours}h
                              </span>
                            </div>

                            <h3
                              onClick={() => handleOpenDetail(item)}
                              className="font-bold text-slate-900 dark:text-slate-100 text-base hover:text-route cursor-pointer line-clamp-1"
                            >
                              {item.resource?.title}
                            </h3>

                            {item.reason && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                                "{item.reason}"
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                            <button
                              onClick={() => handleWhyThis(item)}
                              className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
                            >
                              Why this?
                            </button>

                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="text-xs font-semibold text-route hover:bg-route-light px-3 py-1.5 rounded-lg border border-route/20 dark:hover:bg-route/20 transition-colors"
                            >
                              Details →
                            </button>

                            {!isCompleted && !isSkipped && (
                              <Button
                                onClick={() => handleAction(item, "complete")}
                                className="text-xs px-3.5 py-1.5"
                              >
                                ✓ Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
