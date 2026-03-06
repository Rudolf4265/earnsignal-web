import type { ReactNode } from "react";
import { PanelCard } from "@/src/components/ui/panel-card";

type PanelProps = {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, description, rightSlot, children }: PanelProps) {
  return (
    <PanelCard title={title} description={description} rightSlot={rightSlot}>
      {children}
    </PanelCard>
  );
}
