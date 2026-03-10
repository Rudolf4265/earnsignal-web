import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeVariant = "neutral" | "accent" | "success";

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: "border-brand-border bg-brand-panel-muted/80 text-brand-text-secondary",
  accent: "border-brand-border-strong bg-brand-panel text-brand-text-primary",
  success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
