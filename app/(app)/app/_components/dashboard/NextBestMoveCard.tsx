import Link from "next/link";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";

type NextBestMoveCardProps = {
  title: string;
  description: string;
  confidenceLabel?: string;
  loading?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

export function NextBestMoveCard({
  title,
  description,
  confidenceLabel,
  loading = false,
  ctaLabel,
  ctaHref,
}: NextBestMoveCardProps) {
  return (
    <section className="space-y-3" data-testid="dashboard-next-best-move">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">Next best move</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-brand-text-primary">One clear recommendation</h2>
      </div>

      <article className="rounded-[1.4rem] border border-brand-accent-teal/22 bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94))] p-5 shadow-brand-glow">
        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-24 bg-brand-border/50" />
            <SkeletonBlock className="h-6 w-3/4 bg-brand-border/45" />
            <SkeletonBlock className="h-4 w-full bg-brand-border/35" />
            <SkeletonBlock className="h-4 w-5/6 bg-brand-border/30" />
          </div>
        ) : (
          <div className="space-y-3">
            {confidenceLabel ? (
              <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                {confidenceLabel}
              </p>
            ) : null}
            <h3 className="text-xl font-semibold tracking-tight text-brand-text-primary">{title}</h3>
            <p className="max-w-3xl text-sm leading-relaxed text-brand-text-secondary">{description}</p>
            {ctaLabel && ctaHref ? (
              <Link href={ctaHref} className={buttonClassName({ variant: "primary", className: "shadow-brand-glow" })}>
                {ctaLabel}
              </Link>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
}
