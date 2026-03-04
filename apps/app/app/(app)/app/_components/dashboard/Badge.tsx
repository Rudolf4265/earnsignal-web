import type { ReactNode } from "react";

type BadgeProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
};

const variantClasses: Record<BadgeProps["variant"], string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
