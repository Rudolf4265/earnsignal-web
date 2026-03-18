"use client";

import Link from "next/link";
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ActionCardsSection } from "../../_components/dashboard/ActionCardsSection";
import { CreatorHealthPanel } from "../../_components/dashboard/CreatorHealthPanel";
import { DashboardMetricStrip } from "../../_components/dashboard/DashboardMetricStrip";
import { DashboardOnboardingSection } from "../../_components/dashboard/DashboardOnboardingSection";
import { DashboardTopShell } from "../../_components/dashboard/DashboardTopShell";
import { DashboardUtilitySection } from "../../_components/dashboard/DashboardUtilitySection";
import { GrowDashboardSection } from "../../_components/dashboard/GrowDashboardSection";
import { InsightCardsSection } from "../../_components/dashboard/InsightCardsSection";
import { RevenueTrendSection } from "../../_components/dashboard/RevenueTrendSection";
import { PanelCard } from "@/src/components/ui/panel-card";
import { buttonClassName } from "@/src/components/ui/button";
import { DEBUG_DEMO_ROUTE } from "@/src/lib/debug/routes";
import {
  buildDemoWorkspaceSearch,
  DEMO_WORKSPACE_QUERY_PARAM,
  getDemoWorkspaceFixture,
  listDemoWorkspaces,
  resolveDemoWorkspaceMode,
} from "@/src/lib/demo/demo-workspaces";

function assertDemoEnabled() {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_DEBUG !== "true") {
    notFound();
  }
}

type PersonaLinkCardProps = {
  active: boolean;
  href: string;
  label: string;
  focusLabel: string;
  stateLabel: string;
  scenario: string;
};

function PersonaLinkCard({ active, href, label, focusLabel, stateLabel, scenario }: PersonaLinkCardProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-[1.2rem] border p-4 transition ${
        active
          ? "border-brand-accent-teal/45 bg-[linear-gradient(155deg,rgba(47,217,197,0.12),rgba(18,38,73,0.92))] shadow-brand-glow"
          : "border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.84),rgba(19,41,80,0.72))] hover:border-brand-border-strong/85 hover:bg-brand-panel/85"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-brand-border/75 bg-brand-panel/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">
          {focusLabel}
        </span>
        <span className="rounded-full border border-brand-border/75 bg-brand-panel/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">
          {stateLabel}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-brand-text-primary">{label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{scenario}</p>
    </Link>
  );
}

function SampleReportSection({
  anchorId,
  title,
  generatedAtLabel,
  summary,
  highlights,
  nextSteps,
}: {
  anchorId: string;
  title: string;
  generatedAtLabel: string;
  summary: string;
  highlights: string[];
  nextSteps: string[];
}) {
  return (
    <section id={anchorId} className="scroll-mt-8" data-testid="demo-sample-report">
      <PanelCard
        title={title}
        description={`Sample report summary updated ${generatedAtLabel}.`}
        className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.82),rgba(16,32,67,0.95))]"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
          <article className="rounded-[1.15rem] border border-brand-border/75 bg-brand-panel/72 p-5 shadow-brand-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Narrative</p>
            <p className="mt-3 text-sm leading-relaxed text-brand-text-primary">{summary}</p>
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Highlights</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-text-secondary">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-[1.15rem] border border-brand-border/75 bg-brand-panel/72 p-5 shadow-brand-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Next steps</p>
            <ol className="mt-3 space-y-3 text-sm leading-relaxed text-brand-text-secondary">
              {nextSteps.map((item, index) => (
                <li key={item}>
                  <span className="mr-2 text-brand-text-primary">{index + 1}.</span>
                  {item}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </PanelCard>
    </section>
  );
}

export default function DemoDashboardPage() {
  assertDemoEnabled();

  if (!DEBUG_DEMO_ROUTE) {
    notFound();
  }

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaces = useMemo(() => listDemoWorkspaces(), []);
  const workspace = useMemo(() => getDemoWorkspaceFixture(searchParams.get(DEMO_WORKSPACE_QUERY_PARAM)), [searchParams]);
  const dashboardMode = useMemo(
    () => resolveDemoWorkspaceMode(searchParams.get("mode"), workspace),
    [searchParams, workspace],
  );

  const growModel = workspace.dashboard.grow.model;
  const growGuidanceLimited =
    dashboardMode === "grow" && (!growModel || growModel.availability !== "structured" || !growModel.creatorScore);
  const showDashboardOnboarding = workspace.dashboard.hasReports !== true || growGuidanceLimited;
  const actionCards = workspace.dashboard.earn.actionCards;
  const latestReportHref = workspace.dashboard.utility.latestReportHref;

  const buildHref = useCallback(
    (workspaceId: string, explicitMode?: "earn" | "grow") => {
      const query = buildDemoWorkspaceSearch(searchParams, workspaceId, explicitMode ?? null);
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  const handleModeChange = useCallback(
    (nextMode: "earn" | "grow") => {
      const query = buildDemoWorkspaceSearch(searchParams, workspace.id, nextMode);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, workspace.id],
  );

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-5">
      <section
        className="rounded-[1.6rem] border border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(12,28,57,0.97),rgba(18,40,82,0.94),rgba(11,24,50,0.98))] p-6 shadow-brand-card"
        data-testid="demo-workspace-banner"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Internal demo workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-brand-text-primary md:text-[2.5rem]">Demo workspaces</h1>
            <p className="text-sm leading-relaxed text-brand-text-secondary md:text-base">
              Sample dashboard states for QA, stakeholder demos, and user testing. Live workspace behavior, upload support, and report flows are unchanged.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-border/75 bg-brand-panel/70 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-text-secondary">
              Sample data only
            </span>
            <span className="rounded-full border border-brand-border/75 bg-brand-panel/70 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-text-secondary">
              Non-production only
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4" data-testid="demo-persona-selector">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-text-muted">Persona selector</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-brand-text-primary">Choose a demo workspace</h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
              Each persona is deterministic and isolated from live user data.
            </p>
          </div>
          <Link
            href="/app/debug/qa"
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "border-brand-border/75 bg-brand-panel/72 shadow-brand-card hover:bg-brand-panel-muted/90",
            })}
          >
            Back to QA links
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workspaces.map((candidate) => (
            <PersonaLinkCard
              key={candidate.id}
              active={candidate.id === workspace.id}
              href={buildHref(candidate.id)}
              label={candidate.shortLabel}
              focusLabel={candidate.focusLabel}
              stateLabel={candidate.stateLabel}
              scenario={candidate.scenario}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.9),rgba(19,41,80,0.8),rgba(16,32,67,0.92))] p-5 shadow-brand-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.16em] text-brand-text-secondary">Current demo persona</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary">{workspace.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{workspace.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-border/75 bg-brand-panel/72 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-text-secondary">
              {workspace.focusLabel}
            </span>
            <span className="rounded-full border border-brand-border/75 bg-brand-panel/72 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-text-secondary">
              {workspace.stateLabel}
            </span>
            <span className="rounded-full border border-brand-border/75 bg-brand-panel/72 px-3 py-1 text-xs uppercase tracking-[0.14em] text-brand-text-secondary">
              Demo workspace
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-brand-text-primary">{workspace.scenario}</p>
      </section>

      <DashboardTopShell
        mode={dashboardMode}
        onModeChange={handleModeChange}
        refreshing={false}
        refreshDisabled={false}
        onRefresh={handleRefresh}
        primaryCtaLabel={workspace.dashboard.primaryCtaLabel}
        primaryCtaHref={workspace.dashboard.primaryCtaHref}
      />

      {showDashboardOnboarding ? (
        <DashboardOnboardingSection
          mode={dashboardMode}
          hasUpload={workspace.dashboard.hasUpload}
          hasReports={workspace.dashboard.hasReports}
          growGuidanceLimited={growGuidanceLimited}
          ctaLabel={workspace.dashboard.primaryCtaLabel}
          ctaHref={workspace.dashboard.primaryCtaHref}
        />
      ) : null}

      {dashboardMode === "earn" ? (
        <>
          {/* Top executive summary: rows 1–3 grouped tighter */}
          <div className="space-y-4">
            {/* Row 1: Primary Health (left) + Signals Worth Watching (right) */}
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <CreatorHealthPanel
                creatorHealth={workspace.dashboard.earn.model.creatorHealth}
                loading={false}
                latestReportRow={workspace.dashboard.utility.latestReportRow}
                latestReportHref={latestReportHref}
                latestReportStatusLabel={workspace.dashboard.utility.latestReportStatusLabel}
                latestReportStatusVariant={workspace.dashboard.utility.latestReportStatusVariant}
                diagnosisNotice={workspace.dashboard.earn.diagnosis.notice}
              />

              <InsightCardsSection insights={workspace.dashboard.earn.insights} diagnosis={workspace.dashboard.earn.diagnosis} loading={false} />
            </div>

            {/* Row 2: Compact metric strip */}
            <DashboardMetricStrip
              revenueSnapshot={workspace.dashboard.earn.model.revenueSnapshot}
              churnVelocity={null}
              coverageMonths={null}
            />

            {/* Row 3: Next Best Move */}
            <ActionCardsSection mode={actionCards.mode} cards={actionCards.cards} presentation="hero" />
          </div>

          <RevenueTrendSection
            trend={workspace.dashboard.earn.revenueTrend}
            trendPreview={workspace.dashboard.earn.trendPreview}
            loading={false}
            ctaLabel={workspace.dashboard.primaryCtaLabel}
            ctaHref={workspace.dashboard.primaryCtaHref}
          />

          <DashboardUtilitySection
            entitled={workspace.dashboard.utility.entitled}
            planTier={workspace.dashboard.utility.planTier}
            planStatusLabel={workspace.dashboard.utility.planStatusLabel}
            planStatusVariant={workspace.dashboard.utility.planStatusVariant}
            loading={false}
            workspaceReadiness={workspace.dashboard.utility.workspaceReadiness}
            reportsCheckError={workspace.dashboard.utility.reportsCheckError}
            platformsConnectedLabel={workspace.dashboard.utility.platformsConnectedLabel}
            coverageLabel={workspace.dashboard.utility.coverageLabel}
            lastUploadLabel={workspace.dashboard.utility.lastUploadLabel}
            latestReportRow={workspace.dashboard.utility.latestReportRow}
            latestReportHref={latestReportHref}
            latestReportStatusLabel={workspace.dashboard.utility.latestReportStatusLabel}
            latestReportStatusVariant={workspace.dashboard.utility.latestReportStatusVariant}
            ctaLabel={workspace.dashboard.primaryCtaLabel}
            ctaHref={workspace.dashboard.primaryCtaHref}
          />
        </>
      ) : (
        <>
          <GrowDashboardSection
            model={workspace.dashboard.grow.model}
            loading={false}
            actionMode={actionCards.mode}
            ctaLabel={workspace.dashboard.primaryCtaLabel}
            ctaHref={workspace.dashboard.primaryCtaHref}
          />

          <DashboardUtilitySection
            entitled={workspace.dashboard.utility.entitled}
            planTier={workspace.dashboard.utility.planTier}
            planStatusLabel={workspace.dashboard.utility.planStatusLabel}
            planStatusVariant={workspace.dashboard.utility.planStatusVariant}
            loading={false}
            workspaceReadiness={workspace.dashboard.utility.workspaceReadiness}
            reportsCheckError={workspace.dashboard.utility.reportsCheckError}
            platformsConnectedLabel={workspace.dashboard.utility.platformsConnectedLabel}
            coverageLabel={workspace.dashboard.utility.coverageLabel}
            lastUploadLabel={workspace.dashboard.utility.lastUploadLabel}
            latestReportRow={workspace.dashboard.utility.latestReportRow}
            latestReportHref={latestReportHref}
            latestReportStatusLabel={workspace.dashboard.utility.latestReportStatusLabel}
            latestReportStatusVariant={workspace.dashboard.utility.latestReportStatusVariant}
            ctaLabel={workspace.dashboard.primaryCtaLabel}
            ctaHref={workspace.dashboard.primaryCtaHref}
          />
        </>
      )}

      {workspace.sampleReport ? (
        <SampleReportSection
          anchorId={workspace.sampleReport.anchorId}
          title={workspace.sampleReport.title}
          generatedAtLabel={workspace.sampleReport.generatedAtLabel}
          summary={workspace.sampleReport.summary}
          highlights={workspace.sampleReport.highlights}
          nextSteps={workspace.sampleReport.nextSteps}
        />
      ) : (
        <PanelCard
          title="No sample report yet"
          description="This persona intentionally keeps the report state empty for onboarding and no-report QA."
          className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.9),rgba(19,41,80,0.8),rgba(16,32,67,0.92))]"
        >
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            Use the empty report cards above to verify first-run messaging, next-step guidance, and no-report utility states.
          </p>
        </PanelCard>
      )}
    </div>
  );
}
