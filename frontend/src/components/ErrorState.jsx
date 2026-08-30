import Button from "./Button.jsx";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-lg border border-signal/20 bg-signal/5 p-6 text-center">
      <p className="text-sm text-ink/80">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
