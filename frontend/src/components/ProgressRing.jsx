/**
 * ProgressRing — SVG circular progress indicator
 */
export default function ProgressRing({ completed, total, size = 72, strokeWidth = 6 }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2f6f5e"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-slate-700">{pct}%</span>
    </div>
  );
}
