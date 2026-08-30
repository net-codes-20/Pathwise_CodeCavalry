export default function EmptyState({ title, message }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 p-6 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="max-w-sm text-sm text-ink/60">{message}</p>
    </div>
  );
}
