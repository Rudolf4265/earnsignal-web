import type { ReactNode } from "react";

type BadgeProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
};

const variantClasses: Record<BadgeProps["variant"], string> = {
  good: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  warn: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  neutral: "border-white/15 bg-white/10 text-gray-200",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
