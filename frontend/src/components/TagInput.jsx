import { useState } from "react";

/** Simple tag input: type + Enter/comma to add, click × to remove. */
export default function TagInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink/80">{label}</label>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-ink/15 bg-white p-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-route-light px-2 py-0.5 text-xs text-route-dark">
            {v}
            <button
              type="button"
              className="focus-ring text-route-dark/60 hover:text-route-dark"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="focus-ring min-w-[8rem] flex-1 border-none bg-transparent text-sm outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
