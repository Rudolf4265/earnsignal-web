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
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-secondary">Dashboard Mode</p>
        <p className="mt-1 text-sm text-brand-text-secondary">{activeOption.description}</p>
      </div>

      <div
        className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel-muted/70 p-1 shadow-brand-card"
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
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-accent-teal text-slate-950 shadow-brand-glow"
                  : "text-brand-text-secondary hover:bg-brand-panel hover:text-brand-text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
