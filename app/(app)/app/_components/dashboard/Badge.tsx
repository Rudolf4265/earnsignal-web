import type { ReactNode } from "react";
import { StatusPill } from "@/src/components/ui/status-pill";

type BadgeProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
  className?: string;
  tooltip?: string | null;
};

export function Badge({ variant, children, className, tooltip }: BadgeProps) {
  return <StatusPill variant={variant} className={className} tooltip={tooltip}>{children}</StatusPill>;
}
