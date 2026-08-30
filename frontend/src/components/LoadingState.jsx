export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-route/30 border-t-route" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
