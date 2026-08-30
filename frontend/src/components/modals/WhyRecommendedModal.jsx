import Modal from "../Modal.jsx";
import LoadingState from "../LoadingState.jsx";

export default function WhyRecommendedModal({ open, onClose, title, explanation, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Why was this recommended?">
      {loading ? (
        <LoadingState message="Generating explanation..." />
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {explanation || "This item was recommended as the next logical milestone based on your profile and progress."}
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendation factors</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                <span>✓</span> Addresses target skill gap
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                <span>✓</span> Prerequisites satisfied
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                <span>✓</span> Aligned with target role
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                <span>✓</span> Matches learning preference
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
