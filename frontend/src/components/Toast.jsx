export default function Toast({ message, tone = "success", onDismiss }) {
  if (!message) return null;
  const tones = {
    success: "bg-route-dark text-white",
    info: "bg-ink text-white",
    error: "bg-signal text-white",
  };
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className={`flex items-center gap-3 rounded-md px-4 py-2 text-sm shadow-lg ${tones[tone] || tones.success}`}>
        <span>{message}</span>
        {onDismiss && (
          <button className="focus-ring opacity-70 hover:opacity-100" onClick={onDismiss} aria-label="Dismiss">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
