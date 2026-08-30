import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900">{title}</h2>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-sm font-bold"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-slate-700 space-y-4">{children}</div>
      </div>
    </div>
  );
}
