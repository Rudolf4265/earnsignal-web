import type { AppNavLinkId } from "./app-nav.ts";
import { APP_NAV_LINKS } from "./app-nav.ts";
import type { AdminStatus } from "../gating/admin-guard.ts";

export type WorkspaceNavLink = {
  id: AppNavLinkId;
  href: string;
  label: string;
};

export function buildWorkspaceNavLinks(adminStatus: AdminStatus): WorkspaceNavLink[] {
  return adminStatus === "admin"
    ? [...APP_NAV_LINKS, { id: "admin", href: "/app/admin", label: "Admin" }]
    : [...APP_NAV_LINKS];
}
