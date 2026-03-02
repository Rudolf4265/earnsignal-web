import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, description, rightSlot, children }: PanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
