export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-ink/10 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
