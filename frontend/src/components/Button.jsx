export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "focus-ring inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs";
  const variants = {
    primary: "bg-route text-white hover:bg-route-dark",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
    outline: "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600",
    ghost: "text-route hover:bg-route-light/60 dark:hover:bg-slate-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
