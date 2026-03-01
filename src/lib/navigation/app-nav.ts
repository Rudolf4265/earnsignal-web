export const APP_NAV_LINK_IDS = ["dashboard", "data", "reports", "billing", "settings", "admin"] as const;

export type AppNavLinkId = (typeof APP_NAV_LINK_IDS)[number];

export function getAppNavTestId(id: AppNavLinkId): `nav-${AppNavLinkId}` {
  return `nav-${id}`;
}

export const APP_NAV_LINKS = [
  { id: "dashboard", href: "/app", label: "Dashboard" },
  { id: "data", href: "/app/data", label: "Data" },
  { id: "reports", href: "/app/report", label: "Reports" },
  { id: "billing", href: "/app/billing", label: "Billing" },
  { id: "settings", href: "/app/settings", label: "Settings" },
] as const;
