"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClassName } from "@/src/components/ui/button";
import type { HelpPlatformContent } from "./help-platform-content";
import PlatformCard from "./PlatformCard";
import PlatformHelpDrawer from "./PlatformHelpDrawer";

type HelpOnboardingSurfaceProps = {
  platforms: HelpPlatformContent[];
  reportDrivingSummary: string;
  supportingSummary: string;
};

export default function HelpOnboardingSurface({
  platforms,
  reportDrivingSummary,
  supportingSummary,
}: HelpOnboardingSurfaceProps) {
  const [activePlatform, setActivePlatform] = useState<HelpPlatformContent | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const openDrawer = (platform: HelpPlatformContent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setActivePlatform(platform);
    window.requestAnimationFrame(() => setDrawerVisible(true));
  };

  const closeDrawer = () => {
    setDrawerVisible(false);

    closeTimeoutRef.current = setTimeout(() => {
      setActivePlatform(null);
      closeTimeoutRef.current = null;
    }, 240);
  };

  const csvTemplateCount = platforms.filter((platform) => platform.badge === "CSV template").length;
  const nativeExportCount = platforms.filter((platform) => platform.badge === "Native export").length;

  return (
    <div className="space-y-6" data-testid="help-page-shell">
      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-brand-border-strong/70 bg-[linear-gradient(145deg,rgba(10,24,50,0.96),rgba(15,35,75,0.94),rgba(12,27,54,0.98))] px-6 py-6 shadow-brand-card"
        data-testid="help-page-hero"
      >
        <div className="pointer-events-none absolute -left-24 top-[-5rem] h-64 w-64 rounded-full bg-brand-accent-blue/18 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-8 h-56 w-56 rounded-full bg-brand-accent-emerald/14 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.25fr),minmax(20rem,0.75fr)] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Help & onboarding</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-text-primary sm:text-[2.1rem]">
              Get the right file fast.
            </h1>
            <p className="mt-4 text-sm leading-6 text-brand-text-muted">
              Report-driving sources: {reportDrivingSummary}. Growth-enabled sources: {supportingSummary}.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/app/dashboard"
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                  className: "border-brand-border-strong/75 bg-brand-panel/75 shadow-brand-card hover:bg-brand-panel-muted/90",
                })}
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Supported today", value: `${platforms.length} sources`, detail: "Current public surface only" },
              { label: "CSV templates", value: `${csvTemplateCount}`, detail: "Patreon and Substack" },
              { label: "Native exports", value: `${nativeExportCount}`, detail: "YouTube, TikTok, Instagram" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/72 px-4 py-4"
                data-testid={`help-page-stat-${item.label.toLowerCase().replaceAll(" ", "-")}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-brand-text-primary">{item.value}</p>
                <p className="mt-1 text-sm leading-6 text-brand-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="upload-guide" className="space-y-4" data-testid="help-page-upload-guide">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">Supported uploads</p>
            <h2 className="mt-1 text-2xl font-semibold text-brand-text-primary">Pick a platform. Open the exact steps only when you need them.</h2>
            <p className="mt-2 text-xs text-brand-text-muted">Native Export = the original platform export format.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="help-platform-grid">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform.name}
              icon={platform.icon}
              badge={platform.badge}
              reportRoleLabel={platform.reportRoleLabel}
              secondaryAction={platform.primaryAction.kind === "download" ? platform.primaryAction : null}
              onOpenGuide={() => openDrawer(platform)}
              cardTestId={`help-platform-card-${platform.id}`}
            />
          ))}
        </div>
      </section>

      <div id="after-upload" className="sr-only" aria-hidden="true" />

      {activePlatform ? (
        <PlatformHelpDrawer
          key={activePlatform.id}
          platform={activePlatform}
          visible={drawerVisible}
          onClose={closeDrawer}
        />
      ) : null}
    </div>
  );
}
