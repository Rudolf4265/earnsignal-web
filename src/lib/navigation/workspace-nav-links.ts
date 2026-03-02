import type { AppNavLinkId } from "./app-nav";
import { APP_NAV_LINKS } from "./app-nav";
import type { AdminStatus } from "../gating/admin-guard";

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
