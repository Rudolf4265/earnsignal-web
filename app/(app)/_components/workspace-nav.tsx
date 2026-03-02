"use client";

import Link from "next/link";
import { getAppNavTestId, type AppNavLinkId } from "@/src/lib/navigation/app-nav";
import { buildWorkspaceNavLinks } from "@/src/lib/navigation/workspace-nav-links";
import type { AdminStatus } from "@/src/lib/gating/admin-guard";

type WorkspaceNavLink = { id: AppNavLinkId; href: string; label: string };

function isLinkActive(pathname: string, link: WorkspaceNavLink): boolean {
  if (link.id === "dashboard") {
    return pathname === link.href;
  }

  if (link.id === "reports") {
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }

  return pathname === link.href || pathname.startsWith(link.href);
}

export function WorkspaceNav({
  pathname,
  adminStatus,
  className,
  linkClassName,
  activeLinkClassName,
}: {
  pathname: string;
  adminStatus: AdminStatus;
  className: string;
  linkClassName: string;
  activeLinkClassName: string;
}) {
  const navLinks: WorkspaceNavLink[] = buildWorkspaceNavLinks(adminStatus);

  return (
    <nav className={className}>
      {navLinks.map((link) => {
        const isActive = isLinkActive(pathname, link);

        return (
          <Link
            key={link.href}
            href={link.href}
            data-testid={getAppNavTestId(link.id)}
            aria-current={isActive ? "page" : undefined}
            className={`${linkClassName} ${isActive ? activeLinkClassName : ""}`.trim()}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
