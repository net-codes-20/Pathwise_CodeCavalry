const STYLES = {
  upcoming: "bg-ink/5 text-ink/60",
  current: "bg-route-light text-route-dark",
  completed: "bg-emerald-100 text-emerald-800",
  skipped: "bg-amber-100 text-amber-800",
};

const LABELS = {
  upcoming: "Upcoming",
  current: "Current",
  completed: "Completed",
  skipped: "Skipped",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.upcoming}`}>
      {LABELS[status] || status}
    </span>
  );
}
