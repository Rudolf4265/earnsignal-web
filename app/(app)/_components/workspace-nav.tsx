"use client";

import Link from "next/link";
import { APP_NAV_LINKS, getAppNavTestId, type AppNavLinkId } from "@/src/lib/navigation/app-nav";

type WorkspaceNavLink = {
  id: AppNavLinkId;
  href: string;
  label: string;
};

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
  isAdmin,
  className,
  linkClassName,
  activeLinkClassName,
}: {
  pathname: string;
  isAdmin: boolean;
  className: string;
  linkClassName: string;
  activeLinkClassName: string;
}) {
  const navLinks: WorkspaceNavLink[] = isAdmin
    ? [...APP_NAV_LINKS, { id: "admin", href: "/app/admin", label: "Admin" }]
    : [...APP_NAV_LINKS];

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
