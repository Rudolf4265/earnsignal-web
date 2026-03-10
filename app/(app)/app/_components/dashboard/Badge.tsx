import type { ReactNode } from "react";
import { StatusPill } from "@/src/components/ui/status-pill";

type BadgeProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
  className?: string;
};

export function Badge({ variant, children, className }: BadgeProps) {
  return <StatusPill variant={variant} className={className}>{children}</StatusPill>;
}
