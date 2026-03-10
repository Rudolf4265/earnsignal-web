import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";

type EmptyStateProps = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  appearance?: "base" | "dashboard";
};

export function EmptyState({ title, body, ctaLabel, ctaHref, appearance = "base" }: EmptyStateProps) {
  const isDashboard = appearance === "dashboard";

  return (
    <div
      className={
        isDashboard
          ? "rounded-2xl border border-dashed border-brand-border-strong/70 bg-gradient-to-br from-brand-panel-muted/80 to-brand-panel/70 p-5"
          : "rounded-2xl border border-dashed border-brand-border-strong bg-brand-panel-muted/80 p-5"
      }
    >
      <div
        className={
          isDashboard
            ? "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border/70 bg-brand-panel text-sm font-semibold text-brand-accent-teal"
            : "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-panel text-sm font-semibold text-brand-accent-teal"
        }
      >
        S
      </div>
      <h3 className="mt-3 text-base font-semibold text-brand-text-primary">{title}</h3>
      <p className={isDashboard ? "mt-2 text-sm leading-relaxed text-brand-text-secondary" : "mt-2 text-sm text-brand-text-secondary"}>{body}</p>
      <Link href={ctaHref} className={buttonClassName({ variant: "primary", size: "sm", className: "mt-4" })}>
        {ctaLabel}
      </Link>
    </div>
  );
}
