export default function LevelBadge({ domain, level }) {
  return (
    <span className="rounded-full border border-ink/10 px-2 py-0.5 text-xs text-ink/70">
      {domain.replace("_", " ")} · {level}
    </span>
  );
}
