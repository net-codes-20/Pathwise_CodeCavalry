/**
 * StepIndicator — horizontal multi-step wizard progress bar
 * Props: current (1-indexed), total, labels (optional array)
 */
export default function StepIndicator({ current, total, labels = [] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "bg-route text-white"
                      : active
                      ? "bg-route text-white ring-4 ring-route/20"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? "?" : step}
                </div>
                {labels[i] && (
                  <span className={`mt-1 text-[10px] font-medium hidden sm:block ${active ? "text-route" : "text-slate-400"}`}>
                    {labels[i]}
                  </span>
                )}
              </div>
              {step < total && (
                <div className={`flex-1 h-0.5 mx-1 transition-all ${done ? "bg-route" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
