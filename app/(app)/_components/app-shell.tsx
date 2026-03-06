"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { BRAND_NAME } from "@/src/lib/brand";
import { WorkspaceNav } from "./workspace-nav";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10 text-brand-text-primary">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <BrandMark variant="lockup" priority iconClassName="h-8 w-auto" />
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        </div>

        <WorkspaceNav
          pathname={pathname}
          adminStatus="not_admin"
          className="flex flex-wrap gap-3 text-sm"
          linkClassName="rounded-full border border-brand-border px-3 py-1.5 text-brand-text-secondary transition hover:border-brand-border-strong hover:text-brand-text-primary"
          activeLinkClassName="border-brand-border-strong bg-[var(--es-gradient-nav-active)] text-brand-text-primary"
        />
      </header>

      <section className="rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card">
        {children}
      </section>
    </main>
  );
}
