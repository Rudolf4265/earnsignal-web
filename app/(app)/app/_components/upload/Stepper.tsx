type StepItem = {
  id: string;
  label: string;
};

type StepperProps = {
  steps: StepItem[];
  activeIndex: number;
};

export default function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <>
      <ol className="hidden rounded-[1.35rem] border border-slate-800/80 bg-[linear-gradient(145deg,rgba(7,17,37,0.98),rgba(12,27,53,0.98),rgba(10,24,50,0.98))] px-4 py-3 md:flex md:items-center md:gap-3">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          const connectorActive = index < activeIndex;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  complete
                    ? "border-emerald-200/80 bg-emerald-300 text-slate-950 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]"
                    : active
                      ? "border-blue-200 bg-white text-slate-950 shadow-[0_0_0_4px_rgba(96,165,250,0.18)]"
                      : "border-white/12 bg-white/[0.04] text-slate-400"
                }`}
              >
                {complete ? "\u2713" : index + 1}
              </div>
              <span className={`truncate text-sm font-medium ${active ? "text-white" : complete ? "text-slate-200" : "text-slate-400"}`}>
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <div className={`h-px flex-1 rounded-full ${connectorActive ? "bg-gradient-to-r from-emerald-300/70 to-blue-300/70" : "bg-white/12"}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <ol className="space-y-2 md:hidden">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                complete
                  ? "border-emerald-200 bg-emerald-50"
                  : active
                    ? "border-slate-900 bg-slate-950"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  complete
                    ? "border-emerald-300 bg-emerald-300 text-slate-950"
                    : active
                      ? "border-blue-200 bg-white text-slate-950"
                      : "border-slate-300 bg-transparent text-slate-500"
                }`}
              >
                {complete ? "\u2713" : index + 1}
              </div>
              <span className={`text-sm font-medium ${active ? "text-white" : complete ? "text-slate-900" : "text-slate-600"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
