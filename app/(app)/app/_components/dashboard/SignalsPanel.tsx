import { Badge } from "./Badge";
import { SkeletonBlock } from "../../../_components/ui/skeleton";

export type SignalItem = {
  id: string;
  tone: "positive" | "warning" | "risk" | "neutral";
  label: string;
  title: string;
  body: string;
  lowConfidence?: boolean;
  sourceLabel?: string;
};

export type SignalsPanelProps = {
  signals: SignalItem[];
  biggestConstraint?: {
    title: string;
    body: string;
  } | null;
  loading?: boolean;
};

function toneToVariant(tone: SignalItem["tone"]): "good" | "warn" | "neutral" {
  if (tone === "positive") {
    return "good";
  }

  if (tone === "warning" || tone === "risk") {
    return "warn";
  }

  return "neutral";
}

function SignalRow({ item }: { item: SignalItem }) {
  return (
    <article className="rounded-[1.1rem] border border-brand-border/65 bg-brand-panel/55 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={toneToVariant(item.tone)}>{item.label}</Badge>
        {item.sourceLabel ? <span className="text-[11px] text-brand-text-muted">{item.sourceLabel}</span> : null}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-brand-text-primary">{item.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{item.body}</p>
      {item.lowConfidence ? <p className="mt-2 text-xs text-brand-text-muted">Confidence is still limited.</p> : null}
    </article>
  );
}

function ConstraintRow({ title, body }: { title: string; body: string }) {
  return (
    <article
      className="rounded-[1.1rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(18,38,76,0.86),rgba(14,30,58,0.88))] p-4"
      data-testid="dashboard-signals-biggest-constraint"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary">Biggest constraint</p>
      <h3 className="mt-3 text-base font-semibold leading-snug text-brand-text-primary">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{body}</p>
    </article>
  );
}

export function SignalsPanel({ signals, biggestConstraint, loading = false }: SignalsPanelProps) {
  const primarySignal = signals[0] ?? null;
  const secondarySignal = signals[1] ?? null;
  const tertiarySignal = signals[2] ?? null;

  return (
    <article
      className="flex min-h-[260px] h-full flex-col rounded-[1.5rem] border border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.86),rgba(16,32,67,0.93))] p-6 shadow-brand-card"
      data-testid="dashboard-signals-panel"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-secondary">Signals</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-text-primary">What changed in the latest report</h2>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-1 flex-col gap-3">
          <SkeletonBlock className="h-24 w-full bg-brand-border/55" />
          <SkeletonBlock className="h-24 w-full bg-brand-border/45" />
          <SkeletonBlock className="h-24 w-full bg-brand-border/35" />
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col gap-3">
          {primarySignal ? <SignalRow item={primarySignal} /> : null}
          {biggestConstraint ? <ConstraintRow title={biggestConstraint.title} body={biggestConstraint.body} /> : null}
          {secondarySignal ? <SignalRow item={secondarySignal} /> : null}
          {!primarySignal && !biggestConstraint && tertiarySignal ? <SignalRow item={tertiarySignal} /> : null}
          {!primarySignal && !biggestConstraint && !tertiarySignal ? (
            <div className="rounded-[1.1rem] border border-dashed border-brand-border/65 bg-brand-panel/40 p-4">
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                Signals appear here after a report surfaces a clear pattern worth watching.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
