export default function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-ink/60">
        <span>Progress</span>
        <span>{completed} / {total} complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-route-light" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-route transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
