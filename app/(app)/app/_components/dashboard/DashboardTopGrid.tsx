import type { ReactNode } from "react";

export function DashboardTopGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">{children}</div>;
}
