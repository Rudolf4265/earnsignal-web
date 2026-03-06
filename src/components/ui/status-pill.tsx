import type { ReactNode } from "react";

type StatusPillProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
  className?: string;
};

function joinClassNames(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(" ");
}

const variantClasses: Record<StatusPillProps["variant"], string> = {
  good: "border-[rgba(52,211,153,0.42)] bg-[rgba(52,211,153,0.18)] text-emerald-200",
  warn: "border-[rgba(245,158,11,0.42)] bg-[rgba(245,158,11,0.18)] text-amber-200",
  neutral: "border-brand-border bg-brand-panel-muted/80 text-brand-text-secondary",
};

export function StatusPill({ variant, children, className }: StatusPillProps) {
  return (
    <span className={joinClassNames(["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", variantClasses[variant], className])}>
      {children}
    </span>
  );
}
