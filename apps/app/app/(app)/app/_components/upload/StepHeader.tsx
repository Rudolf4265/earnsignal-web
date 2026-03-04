import type { ReactNode } from "react";

type StepHeaderProps = {
  title: string;
  subtitle?: ReactNode;
};

export default function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
