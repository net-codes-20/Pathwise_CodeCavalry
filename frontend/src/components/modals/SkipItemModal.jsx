import { useState } from "react";
import Modal from "../Modal.jsx";
import Button from "../Button.jsx";

const SKIP_REASONS = [
  "Too difficult",
  "Not relevant",
  "Too long",
  "Already know this",
  "Other",
];

export default function SkipItemModal({ open, onClose, onConfirm, title, loading }) {
  const [selectedReason, setSelectedReason] = useState(SKIP_REASONS[0]);
  const [note, setNote] = useState("");

  const handleSkip = () => {
    const combinedNote = note.trim()
      ? `${selectedReason}: ${note.trim()}`
      : selectedReason;
    onConfirm(combinedNote);
  };

  return (
    <Modal open={open} onClose={onClose} title="Skip Learning Item">
      <div className="space-y-4">
        {title && (
          <p className="text-sm font-medium text-slate-700">
            Skipping: <span className="font-semibold text-slate-900">{title}</span>
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Why are you skipping this?
          </label>
          <div className="space-y-2">
            {SKIP_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                  selectedReason === reason
                    ? "border-route bg-route-light/30 font-medium text-slate-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="skipReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-route"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Optional note
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
            placeholder="Tell us more about why you're skipping this..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSkip} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? "Skipping..." : "Skip Item"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
