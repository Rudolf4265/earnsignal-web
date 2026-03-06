import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";

type EmptyStateProps = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyState({ title, body, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border-strong bg-brand-panel-muted/80 p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-panel text-sm font-semibold text-brand-accent-teal">
        S
      </div>
      <h3 className="mt-3 text-base font-semibold text-brand-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-brand-text-secondary">{body}</p>
      <Link href={ctaHref} className={buttonClassName({ variant: "primary", size: "sm", className: "mt-4" })}>
        {ctaLabel}
      </Link>
    </div>
  );
}
