import { DashboardModeSwitch } from "@/src/components/dashboard/mode-switch";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardMode } from "@/src/lib/dashboard/mode";

const MODE_LABEL: Record<DashboardMode, string> = {
  earn: "Earn Mode",
  grow: "Grow Mode",
};

const MODE_SENTENCE: Record<DashboardMode, string> = {
  earn: "Revenue health and monetization diagnostics.",
  grow: "Audience and engagement guidance.",
};

type DashboardContextTileProps = {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
  workspaceStatusLabel: string;
};

export function DashboardContextTile({ mode, onChange, workspaceStatusLabel }: DashboardContextTileProps) {
  return (
    <section className="h-full" data-testid="dashboard-context-tile">
      <PanelCard className="flex h-full flex-col gap-3 border-brand-border-strong/70 bg-[linear-gradient(145deg,rgba(10,24,50,0.96),rgba(15,35,75,0.95),rgba(16,32,67,0.98))]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Dashboard</p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-brand-text-primary">{MODE_LABEL[mode]}</h2>
          <p className="mt-1 text-sm text-brand-text-secondary">{MODE_SENTENCE[mode]}</p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-brand-border/60 bg-brand-panel-muted/40 px-3 py-1 text-[11px] text-brand-text-muted">
          {workspaceStatusLabel}
        </span>

        <div className="mt-auto">
          <DashboardModeSwitch mode={mode} onChange={onChange} />
        </div>
      </PanelCard>
    </section>
  );
}
