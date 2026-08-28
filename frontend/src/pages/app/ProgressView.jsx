import { useLearner } from "../../context/LearnerContext.jsx";
import { calculateProgress } from "../../utils/roadmap.js";
import AppShell from "../../components/layout/AppShell.jsx";
import ProgressRing from "../../components/ProgressRing.jsx";

export default function ProgressView() {
  const { roadmap, profile } = useLearner();
  const stats = calculateProgress(roadmap);
  const items = roadmap?.items || [];
  const milestones = items.filter((i) => i.milestone);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Top Overview Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-route-light text-route text-xs font-bold uppercase tracking-wider">
                Progress Analytics
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Your Learning Journey
              </h1>
              <p className="text-sm text-slate-500 max-w-md">
                Tracking your real milestones and hours completed towards{" "}
                <strong className="text-slate-800">{profile?.goal || "AI Mastery"}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shrink-0">
              <ProgressRing
                completed={stats.completed}
                total={stats.total || 1}
                size={88}
                strokeWidth={8}
              />
              <div>
                <p className="text-3xl font-bold text-slate-900 font-display">{stats.percentage}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Overall Completion</p>
                <p className="text-xs text-route font-semibold mt-1">
                  {stats.completed} of {stats.total} modules done
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hours Invested</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.completedHours}h</p>
            <p className="text-[11px] text-slate-500 mt-0.5">out of {stats.totalHours}h planned</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Modules Finished</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">verified complete</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Milestones</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">
              {milestones.filter((m) => m.status === "completed").length} / {milestones.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">major checkpoints</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Target</p>
            <p className="text-2xl font-bold text-route mt-1">{profile?.weekly_time_hours || 10}h</p>
            <p className="text-[11px] text-slate-500 mt-0.5">scheduled commitment</p>
          </div>
        </div>

        {/* Milestone Progression & Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestones List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-slate-900">Roadmap Milestones</h3>
              <span className="text-xs font-semibold text-route">
                {milestones.filter((m) => m.status === "completed").length} of {milestones.length} Reached
              </span>
            </div>

            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No milestone markers in current curriculum.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, idx) => {
                  const isDone = m.status === "completed";
                  const isCurrent = m.status === "current" || m.status === "in_progress";
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                        isDone
                          ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                          : isCurrent
                          ? "bg-white border-route ring-2 ring-route/20"
                          : "bg-slate-50/60 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-route text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {m.resource?.title}
                        </p>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {m.resource?.domain?.replace(/_/g, " ")} · ⏱️ {m.resource?.duration_hours}h
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : isCurrent
                            ? "bg-route-light text-route font-semibold"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isDone ? "Completed" : isCurrent ? "Active" : "Upcoming"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Study Pace & Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-slate-900">Study Commitment & Pace</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                At your planned pace of <strong>{profile?.weekly_time_hours || 10} hours/week</strong>, you are projected to complete all {stats.total} roadmap modules in approximately{" "}
                <strong>{Math.ceil(stats.remainingHours / (profile?.weekly_time_hours || 10))} weeks</strong>.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Curriculum Hours Done</span>
                    <span>{stats.completedHours} / {stats.totalHours}h</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-route rounded-full"
                      style={{
                        width: `${stats.totalHours > 0 ? (stats.completedHours / stats.totalHours) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Modules Finished</span>
                    <span>{stats.completed} / {stats.total}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600">
              💡 <strong>Tip:</strong> Consistent study of 45-60 mins daily outperforms long weekend marathons for long-term coding retention.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
