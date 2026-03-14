export type DashboardMode = "earn" | "grow";

export const DASHBOARD_MODE_QUERY_PARAM = "mode";
export const DEFAULT_DASHBOARD_MODE: DashboardMode = "earn";

export function parseDashboardMode(value: string | null | undefined): DashboardMode {
  return value === "grow" ? "grow" : DEFAULT_DASHBOARD_MODE;
}

export function buildDashboardModeSearch(searchParams: { toString(): string }, mode: DashboardMode): string {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (mode === DEFAULT_DASHBOARD_MODE) {
    nextParams.delete(DASHBOARD_MODE_QUERY_PARAM);
  } else {
    nextParams.set(DASHBOARD_MODE_QUERY_PARAM, mode);
  }

  return nextParams.toString();
}
