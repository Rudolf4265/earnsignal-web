"use client";

import type { DashboardMode } from "@/src/lib/dashboard/mode";

type DashboardModeSwitchProps = {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

const MODE_OPTIONS: Array<{
  id: DashboardMode;
  label: string;
  description: string;
}> = [
  {
    id: "earn",
    label: "Earn",
    description: "Revenue, reports, and creator business health.",
  },
  {
    id: "grow",
    label: "Grow",
    description: "Audience growth signals and next actions.",
  },
];

export function DashboardModeSwitch({ mode, onChange }: DashboardModeSwitchProps) {
  const activeOption = MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[0];

  return (
    <section className="space-y-3" data-testid="dashboard-mode-switch">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Dashboard Mode</p>
          <p className="mt-1 text-sm text-brand-text-secondary">Choose the lens you want on the current workspace.</p>
        </div>
        <p className="rounded-full border border-brand-border/70 bg-brand-panel/70 px-3 py-1 text-xs text-brand-text-muted">
          Active: {activeOption.label}
        </p>
      </div>

      <div
        className="grid gap-2 rounded-[1.35rem] border border-brand-border-strong/80 bg-brand-panel-muted/65 p-2 shadow-brand-card sm:grid-cols-2"
        role="tablist"
        aria-label="Dashboard mode"
      >
        {MODE_OPTIONS.map((option) => {
          const active = option.id === mode;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.id)}
              data-testid={`dashboard-mode-${option.id}`}
              className={`rounded-[1rem] border px-4 py-3 text-left transition ${
                active
                  ? "border-brand-accent-teal/45 bg-[linear-gradient(135deg,rgba(47,217,197,0.94),rgba(59,130,246,0.76))] text-slate-950 shadow-brand-glow"
                  : "border-transparent bg-brand-panel/45 text-brand-text-secondary hover:border-brand-border/70 hover:bg-brand-panel/85 hover:text-brand-text-primary"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className={`mt-1 block text-xs leading-relaxed ${active ? "text-slate-950/78" : "text-brand-text-muted"}`}>{option.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
