import Link from "next/link";
import { PanelCard } from "@/src/components/ui/panel-card";
import type { DashboardMode } from "@/src/lib/dashboard/mode";
import { getSupportedRevenueUploadFormatGuidance, getSupportedRevenueUploadSummary } from "@/src/lib/upload/platform-guidance";

type DashboardOnboardingSectionProps = {
  mode: DashboardMode;
  hasUpload: boolean;
  hasReports: boolean | null;
  growGuidanceLimited: boolean;
  ctaLabel: string;
  ctaHref: string;
};

type NextStepContent = {
  title: string;
  body: string;
};

const supportedRevenueUploads = getSupportedRevenueUploadSummary();
const supportedRevenueUploadFormatGuidance = getSupportedRevenueUploadFormatGuidance();

function resolveNextStep({
  hasUpload,
  hasReports,
  growGuidanceLimited,
  mode,
}: Pick<DashboardOnboardingSectionProps, "hasUpload" | "hasReports" | "growGuidanceLimited" | "mode">): NextStepContent {
  if (!hasUpload) {
    return {
      title: "Start with a supported CSV upload.",
      body: `Currently supported uploads are ${supportedRevenueUploads}. ${supportedRevenueUploadFormatGuidance} Upload your latest revenue and subscriber data to unlock Earn first.`,
    };
  }

  if (hasReports !== true) {
    return {
      title: "Generate the first report from your upload.",
      body: "Your file is connected. Generate a report to populate creator health, key metrics, latest report detail, and clearer next actions.",
    };
  }

  if (mode === "grow" && growGuidanceLimited) {
    return {
      title: "Use Earn now and return to Grow as analytics improve.",
      body: "Earn already reflects monetization health. Grow is the audience and engagement side, and richer scorecards appear when supported analytics are available.",
    };
  }

  return {
    title: "Keep the workspace current with fresh exports.",
    body: "Update the workspace with your latest supported CSVs whenever you want the dashboard and reports to reflect the newest revenue evidence.",
  };
}

export function DashboardOnboardingSection({
  mode,
  hasUpload,
  hasReports,
  growGuidanceLimited,
  ctaLabel,
  ctaHref,
}: DashboardOnboardingSectionProps) {
  const nextStep = resolveNextStep({ hasUpload, hasReports, growGuidanceLimited, mode });

  return (
    <PanelCard
      title="Quick start"
      description="A short guide for new or still-warming-up workspaces."
      className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.82),rgba(18,38,73,0.76),rgba(12,29,60,0.86))]"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 lg:grid-cols-3" data-testid="dashboard-onboarding-section">
        <article
          className="rounded-[1.1rem] border border-brand-border/75 bg-brand-panel/68 p-4 shadow-brand-card"
          data-testid="dashboard-onboarding-how-it-works"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">EarnSigma in one minute</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-brand-text-primary">Upload, validate, then review the latest workspace evidence.</h3>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-brand-text-secondary">
            <li>Upload a supported CSV from your creator revenue workflow.</li>
            <li>EarnSigma validates the file first, then continues processing when report generation is available.</li>
            <li>Your dashboard and latest report update as soon as the workspace is ready.</li>
          </ol>
        </article>

        <article
          className="rounded-[1.1rem] border border-brand-border/75 bg-brand-panel/68 p-4 shadow-brand-card"
          data-testid="dashboard-onboarding-mode-guide"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Earn vs Grow</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-sm font-semibold text-brand-text-primary">Earn</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                Earn tracks revenue, subscriptions, and monetization health from the latest report.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text-primary">Grow</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                Grow is the audience and engagement side. Richer scorecards appear when supported analytics are available.
              </p>
            </div>
          </div>
        </article>

        <article
          className="rounded-[1.1rem] border border-brand-border/75 bg-brand-panel/68 p-4 shadow-brand-card"
          data-testid="dashboard-onboarding-next-step"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">What to do next</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-brand-text-primary">{nextStep.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{nextStep.body}</p>
          <p className="mt-3 text-xs leading-relaxed text-brand-text-muted">
            Need details? Open the help guide or continue with the current workspace CTA.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/app/help#upload-guide" data-testid="dashboard-onboarding-help-link" className="text-brand-accent-teal transition hover:text-brand-text-primary">
              Open help guide
            </Link>
            <Link href={ctaHref} className="text-brand-text-secondary transition hover:text-brand-text-primary">
              {ctaLabel}
            </Link>
          </div>
        </article>
      </div>
    </PanelCard>
  );
}
