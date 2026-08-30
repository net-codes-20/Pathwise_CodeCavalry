import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { getRoadmap, explainItem, sendFeedback } from "../../api/roadmap.js";
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

export default function RoadmapItemDetail() {
  const { roadmapId: paramRoadmapId, itemId } = useParams();
  const { roadmap, setRoadmap, roadmapId: ctxRoadmapId, reloadRoadmap } = useLearner();
  const navigate = useNavigate();

  const effectiveRoadmapId = paramRoadmapId || ctxRoadmapId || roadmap?.id;
  const [activeRoadmap, setActiveRoadmap] = useState(roadmap);
  const [loading, setLoading] = useState(!roadmap);

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyExplanation, setWhyExplanation] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);

  const [skipOpen, setSkipOpen] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (effectiveRoadmapId && (!roadmap || roadmap.id !== effectiveRoadmapId)) {
      setLoading(true);
      getRoadmap(effectiveRoadmapId).then((res) => {
        setLoading(false);
        if (res.ok) {
          setActiveRoadmap(res.data);
          setRoadmap(res.data);
        }
      });
    } else {
      setActiveRoadmap(roadmap);
      setLoading(false);
    }
  }, [effectiveRoadmapId, roadmap, setRoadmap]);

  const item = activeRoadmap?.items?.find((i) => i.id === itemId);
  const items = activeRoadmap?.items || [];

  const prerequisiteTitles = (item?.resource?.prerequisites || [])
    .map((pId) => items.find((i) => i.resource?.id === pId || i.id === pId)?.resource?.title)
    .filter(Boolean);

  const handleWhyRecommended = async () => {
    if (!item) return;
    setWhyOpen(true);
    setWhyLoading(true);
    setWhyExplanation("");

    if (effectiveRoadmapId) {
      const res = await explainItem(effectiveRoadmapId, item.id);
      setWhyLoading(false);
      if (res.ok) {
        setWhyExplanation(res.data.explanation);
      } else {
        setWhyExplanation("Could not load AI explanation right now.");
      }
    }
  };

  const handleComplete = async () => {
    if (!effectiveRoadmapId || !item) return;
    const res = await sendFeedback(effectiveRoadmapId, item.id, "complete");
    if (res.ok) {
      setToast({ message: "Module completed!", tone: "success" });
      await reloadRoadmap();
    }
  };

  const handleConfirmSkip = async (reasonNote) => {
    if (!effectiveRoadmapId || !item) return;
    setSkipLoading(true);
    const res = await sendFeedback(effectiveRoadmapId, item.id, "skip", reasonNote);
    setSkipLoading(false);
    setSkipOpen(false);

    if (res.ok) {
      setToast({ message: "Module skipped.", tone: "info" });
      await reloadRoadmap();
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">Loading module details...</div>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell>
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <p className="text-3xl">🔍</p>
          <h3 className="font-bold text-lg text-slate-800">Module not found</h3>
          <Button onClick={() => navigate("/app/roadmap")}>← Back to Roadmap</Button>
        </div>
      </AppShell>
    );
  }

  const { resource, status, milestone, reason } = item;
  const isCompleted = status === "completed";
  const isSkipped = status === "skipped";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-route transition-colors cursor-pointer"
        >
          ← Back
        </button>

        {/* Item Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {milestone && (
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-500/10 dark:bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-500/30 dark:border-emerald-400/25 inline-flex items-center gap-1">
                    ⭐ Core Milestone
                  </span>
                )}
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-semibold capitalize border border-slate-200 dark:border-slate-700">
                  {TYPE_ICONS[resource?.type] || "📄"} {resource?.type}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-semibold capitalize border border-slate-200 dark:border-slate-700">
                  Level: {resource?.level}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full font-semibold border border-slate-200 dark:border-slate-700">
                  ⏱️ {resource?.duration_hours} hours
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{resource?.title}</h1>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {resource?.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-route hover:bg-route-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  Open Resource ↗
                </a>
              )}
            </div>
          </div>

          {/* Description & Learning Objectives */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-white">What you will learn</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resource?.description ||
                "Comprehensive learning material tailored to develop hands-on understanding and key proficiencies for this module."}
            </p>

            {reason && (
              <div className="bg-route-light/40 dark:bg-route/15 border border-route/20 dark:border-route/30 rounded-2xl p-4 text-xs text-route-dark dark:text-route-light leading-relaxed">
                <strong>Why this is in your roadmap:</strong> {reason}
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {prerequisiteTitles.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Prerequisites</h4>
              <div className="flex flex-wrap gap-2">
                {prerequisiteTitles.map((title) => (
                  <span
                    key={title}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-medium"
                  >
                    ✓ {title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleWhyRecommended}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Why was this recommended?
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!isCompleted && !isSkipped && (
                <Button onClick={handleComplete} className="px-5 py-2.5 text-xs font-bold">
                  ✓ Mark Complete
                </Button>
              )}
              {(isCompleted || isSkipped) && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl">
                  {isCompleted ? "✅ Completed Module" : "⏭ Skipped Module"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modals & Toast */}
        <WhyRecommendedModal
          open={whyOpen}
          onClose={() => setWhyOpen(false)}
          title={resource?.title}
          explanation={whyExplanation}
          loading={whyLoading}
        />

        <SkipItemModal
          open={skipOpen}
          onClose={() => setSkipOpen(false)}
          onConfirm={handleConfirmSkip}
          title={resource?.title}
          loading={skipLoading}
        />

        <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
