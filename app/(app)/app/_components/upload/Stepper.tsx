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
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <div key={step.id} className="flex min-w-fit flex-1 items-center gap-2">
              <div className="flex min-w-fit items-center gap-2">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset transition",
                    complete && "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
                    active && "bg-blue-500/15 text-blue-200 ring-blue-400/30 shadow-[0_0_18px_-8px_rgba(59,130,246,0.8)]",
                    !active && !complete && "bg-white/[0.03] text-slate-400 ring-white/10",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {index + 1}
                </div>
                <span className={active || complete ? "text-sm text-white" : "text-sm text-slate-400"}>{step.label}</span>
              </div>

              {index < steps.length - 1 ? <div className="h-px min-w-[48px] flex-1 bg-white/8" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
