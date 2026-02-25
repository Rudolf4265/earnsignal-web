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
      <ol className="hidden md:flex md:items-center md:gap-3">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                  complete
                    ? "border-brand-blue bg-brand-blue text-white"
                    : active
                      ? "border-brand-blue/80 bg-brand-blue/20 text-white"
                      : "border-white/20 bg-navy-950 text-gray-400"
                }`}
              >
                {complete ? "✓" : index + 1}
              </div>
              <span className={`truncate text-sm ${active || complete ? "text-white" : "text-gray-500"}`}>
                {step.label}
              </span>
              {index < steps.length - 1 ? <div className="h-px flex-1 bg-white/10" /> : null}
            </li>
          );
        })}
      </ol>

      <ol className="space-y-2 md:hidden">
        {steps.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={step.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-950 px-3 py-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                  complete
                    ? "border-brand-blue bg-brand-blue text-white"
                    : active
                      ? "border-brand-blue/80 bg-brand-blue/20 text-white"
                      : "border-white/20 bg-transparent text-gray-400"
                }`}
              >
                {complete ? "✓" : index + 1}
              </div>
              <span className={`text-sm ${active || complete ? "text-white" : "text-gray-500"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
