import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoadmap, explainItem, sendFeedback, replanRoadmap } from "../api/roadmap.js";
import { getProfile } from "../api/profile.js";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import DashboardShell from "../components/DashboardShell.jsx";
import ResourceCard from "../components/ResourceCard.jsx";
import ProgressRing from "../components/ProgressRing.jsx";

function GoalBanner({ roadmap, profile, completedCount }) {
  const items = roadmap?.items || [];
  const milestones = items.filter((i) => i.milestone);
  const nextMilestone = milestones.find(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );

  return (
    <div className="bg-gradient-to-br from-route-dark via-route to-[#4a9b82] rounded-2xl p-6 text-white mb-6 shadow-md">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
            Your Learning Roadmap
          </p>
          <h1 className="font-display text-xl md:text-2xl font-semibold leading-snug line-clamp-2">
            {profile?.goal || "Personalised Learning Path"}
          </h1>
          {nextMilestone && (
            <div className="mt-3 flex items-center gap-2 text-white/80 text-xs">
              <span>⭐ Next milestone:</span>
              <span className="font-semibold text-white line-clamp-1">{nextMilestone.resource.title}</span>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {profile?.experience_level && (
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                {profile.experience_level}
              </span>
            )}
            {profile?.timeline_months && (
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                ⏱️ {profile.timeline_months} month plan
              </span>
            )}
            {profile?.weekly_time_hours && (
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                🕐 {profile.weekly_time_hours}h/week
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <ProgressRing
            completed={completedCount}
            total={items.length}
            size={80}
            strokeWidth={7}
          />
          <p className="text-white/70 text-[10px] text-center mt-1">{completedCount}/{items.length}</p>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyText, setWhyText] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);
  const [whyTitle, setWhyTitle] = useState("");

  const [toast, setToast] = useState(null);
  const [replanning, setReplanning] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await getRoadmap(id);
    if (!res.ok) { setLoading(false); setError("Could not load your roadmap."); return; }
    setRoadmap(res.data);
    const profRes = await getProfile(res.data.learner_profile_id);
    setLoading(false);
    if (profRes.ok) setProfile(profRes.data);
  }

  async function handleWhyThis(item) {
    setWhyTitle(item.resource.title);
    setWhyOpen(true);
    setWhyLoading(true);
    setWhyText("");
    const res = await explainItem(id, item.id);
    setWhyLoading(false);
    setWhyText(res.ok ? res.data.explanation : "Could not load an explanation right now.");
  }

  async function handleAction(item, action) {
    const res = await sendFeedback(id, item.id, action);
    if (!res.ok) { setToast({ message: "Could not save — try again.", tone: "error" }); return; }
    setToast({ message: action === "complete" ? "✅ Marked complete!" : "⏭ Skipped.", tone: "success" });
    await load();
    if (res.data.replan_recommended) {
      setReplanning(true);
      setToast({ message: "Updating your path...", tone: "info" });
      const replanRes = await replanRoadmap(id);
      setReplanning(false);
      if (replanRes.ok) {
        navigate(`/roadmap/${replanRes.data.roadmap.id}/replanned`, {
          state: { changesSummary: replanRes.data.changes_summary, roadmap: replanRes.data.roadmap },
        });
      }
    }
  }

  if (loading) return <LoadingState message="Loading your roadmap..." />;
  if (error) return <div className="mx-auto max-w-2xl px-6 py-12"><ErrorState message={error} onRetry={load} /></div>;
  if (!roadmap) return null;

  if (!roadmap.items || roadmap.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <EmptyState
          title="No resources found yet"
          message="Try broadening your interests or experience level on your profile."
        />
      </div>
    );
  }

  const items = roadmap.items;
  const completedCount = items.filter(
    (i) => i.status === "completed" || i.status === "skipped"
  ).length;
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const currentItems = sortedItems.filter((i) => i.status === "current" || i.status === "upcoming").slice(0, 3);

  return (
    <DashboardShell roadmap={roadmap} profile={profile}>
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <GoalBanner roadmap={roadmap} profile={profile} completedCount={completedCount} />

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Completed", value: completedCount, icon: "✅", color: "text-green-600" },
            { label: "Remaining", value: items.length - completedCount, icon: "📋", color: "text-slate-700" },
            { label: "Milestones", value: items.filter((i) => i.milestone).length, icon: "⭐", color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.icon} {s.label}</p>
            </div>
          ))}
        </div>

        {currentItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">▶ Up Next</h2>
            <div className="space-y-3">
              {currentItems.map((item) => {
                const prereqTitles = (item.resource.prerequisites || [])
                  .map((pId) => items.find((i) => i.resource.id === pId)?.resource.title)
                  .filter(Boolean);
                return (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    prerequisiteTitles={prereqTitles}
                    onWhyThis={() => handleWhyThis(item)}
                    onSkip={() => handleAction(item, "skip")}
                    onComplete={() => handleAction(item, "complete")}
                    disabled={replanning}
                  />
                );
              })}
            </div>
          </div>
        )}

        {sortedItems.length > 3 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📋 Full Roadmap</h2>
            <div className="space-y-3">
              {sortedItems.slice(3).map((item) => {
                const prereqTitles = (item.resource.prerequisites || [])
                  .map((pId) => items.find((i) => i.resource.id === pId)?.resource.title)
                  .filter(Boolean);
                return (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    prerequisiteTitles={prereqTitles}
                    onWhyThis={() => handleWhyThis(item)}
                    onSkip={() => handleAction(item, "skip")}
                    onComplete={() => handleAction(item, "complete")}
                    disabled={replanning}
                  />
                );
              })}
            </div>
          </div>
        )}

        <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title={`Why: ${whyTitle}`}>
          {whyLoading ? (
            <LoadingState message="Thinking..." />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-700 leading-relaxed">{whyText}</p>
            </div>
          )}
        </Modal>

        <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      </div>
    </DashboardShell>
  );
}