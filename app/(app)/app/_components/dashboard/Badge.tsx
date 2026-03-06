import type { ReactNode } from "react";
import { StatusPill } from "@/src/components/ui/status-pill";

type BadgeProps = {
  variant: "good" | "warn" | "neutral";
  children: ReactNode;
};

export function Badge({ variant, children }: BadgeProps) {
  return <StatusPill variant={variant}>{children}</StatusPill>;
}
