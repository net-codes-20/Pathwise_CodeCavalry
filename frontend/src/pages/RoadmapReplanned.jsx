import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRoadmap, explainItem, sendFeedback, replanRoadmap } from "../api/roadmap.js";
import { getProfile } from "../api/profile.js";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import DashboardShell from "../components/DashboardShell.jsx";
import ResourceCard from "../components/ResourceCard.jsx";

export default function RoadmapReplanned() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(location.state?.roadmap || null);
  const [profile, setProfile] = useState(null);
  const [changesSummary, setChangesSummary] = useState(location.state?.changesSummary || "");
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
    let activeRoadmap = roadmap;
    if (!activeRoadmap) {
      const res = await getRoadmap(id);
      if (!res.ok) { setLoading(false); setError("Could not load your updated roadmap."); return; }
      activeRoadmap = res.data;
      setRoadmap(activeRoadmap);
    }
    const profRes = await getProfile(activeRoadmap.learner_profile_id);
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
    setToast({ message: "✅ Marked complete!", tone: "success" });
    await load();
    if (res.data.replan_recommended) {
      setReplanning(true);
      setToast({ message: "Updating your path...", tone: "info" });
      const replanRes = await replanRoadmap(id);
      setReplanning(false);
      if (replanRes.ok) {
        setRoadmap(replanRes.data.roadmap);
        setChangesSummary(replanRes.data.changes_summary);
      }
    }
  }

  if (loading) return <LoadingState message="Loading your updated roadmap..." />;
  if (error) return <div className="mx-auto max-w-2xl px-6 py-12"><ErrorState message={error} /></div>;
  if (!roadmap) return null;

  return (
    <DashboardShell roadmap={roadmap} profile={profile}>
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">
            🔄 Roadmap Updated
          </p>
          <h1 className="font-display text-2xl font-semibold">Your path just adapted</h1>
          <p className="text-white/80 text-sm mt-1">
            Based on your progress, we have adjusted your learning sequence.
          </p>
        </div>

        {changesSummary && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">What changed</p>
                <p className="text-sm text-amber-900 leading-relaxed">{changesSummary}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {roadmap.items
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item) => {
              const prereqTitles = (item.resource.prerequisites || [])
                .map((pId) => roadmap.items.find((i) => i.resource.id === pId)?.resource.title)
                .filter(Boolean);
              return (
                <ResourceCard
                  key={item.id}
                  item={item}
                  prerequisiteTitles={prereqTitles}
                  onWhyThis={() => handleWhyThis(item)}
                  onComplete={() => handleAction(item, "complete")}
                  disabled={replanning}
                />
              );
            })}
        </div>

        <button
          onClick={() => navigate(`/roadmap/${roadmap.id}`)}
          className="w-full bg-route text-white font-semibold py-3 rounded-xl hover:bg-route-dark transition-colors text-sm mb-6"
        >
          Continue to Dashboard →
        </button>

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