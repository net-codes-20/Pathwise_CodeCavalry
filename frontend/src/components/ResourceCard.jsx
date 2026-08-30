import StatusBadge from "./StatusBadge.jsx";

const TYPE_ICONS = {
  course: "🎓", article: "📄", video: "🎥",
  project: "🛠️", assessment: "📝", book: "📚",
};

const STATUS_STYLES = {
  completed: "bg-green-50 border-l-4 border-l-green-400 opacity-75",
  skipped:   "bg-slate-50 border-l-4 border-l-slate-300 opacity-60",
  current:   "bg-white border-l-4 border-l-route shadow-sm",
  upcoming:  "bg-white",
};

export default function ResourceCard({
  item,
  prerequisiteTitles = [],
  onWhyThis,
  onComplete,
  disabled = false,
}) {
  const { resource, status, milestone, reason } = item;
  const icon = TYPE_ICONS[resource.type] || "📄";
  const cardStyle = STATUS_STYLES[status] || "bg-white";

  return (
    <div className={`rounded-2xl border border-slate-100 p-4 md:p-5 transition-shadow hover:shadow-md ${cardStyle}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            {milestone && (
              <span title="Milestone" className="text-amber-500 text-base mt-0.5 shrink-0">⭐</span>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm md:text-base leading-snug">
                {resource.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {icon} {resource.type}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  ⏱️ {resource.duration_hours}h
                </span>
                {resource.domain && (
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium capitalize">
                    {resource.domain.replace("_", " ")} · {resource.level}
                  </span>
                )}
              </div>

              {reason && (
                <p className="mt-2.5 text-xs text-slate-500 italic border-l-2 border-route/20 pl-3 leading-relaxed">
                  {reason}
                </p>
              )}

              {prerequisiteTitles.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400 font-medium">
                  Requires:{" "}
                  <span className="text-slate-600">
                    {prerequisiteTitles.join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 gap-2 items-center self-end md:self-start flex-wrap">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-route bg-route-light/80 hover:bg-route-light px-3 py-1.5 rounded-lg transition-colors border border-route/20 inline-flex items-center gap-1 shrink-0"
            >
              Open Resource ↗
            </a>
          )}

          {onWhyThis && (
            <button
              onClick={onWhyThis}
              className="text-[11px] font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            >
              Why this?
            </button>
          )}

          {status !== "completed" && status !== "skipped" && onComplete && (
            <button
              onClick={onComplete}
              disabled={disabled}
              className="text-[11px] font-semibold text-white bg-route hover:bg-route-dark px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              ✓ Complete
            </button>
          )}

          {(status === "completed" || status === "skipped") && (
            <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              {status === "completed" ? "✅ Completed" : "⏭ Skipped"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}