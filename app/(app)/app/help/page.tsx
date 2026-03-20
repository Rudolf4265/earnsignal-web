import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import { getSupportedRevenueUploadSummary } from "@/src/lib/upload/platform-guidance";

const supportedRevenueUploads = getSupportedRevenueUploadSummary();

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[1.5rem] border border-brand-border-strong/75 bg-[linear-gradient(145deg,rgba(10,24,50,0.94),rgba(15,35,75,0.93),rgba(16,32,67,0.96))] px-6 py-5 shadow-brand-card"
        data-testid="help-page-hero"
      >
        <div className="pointer-events-none absolute -left-20 top-[-5rem] h-60 w-60 rounded-full bg-brand-accent-blue/18 blur-3xl" />
        <div className="pointer-events-none absolute right-[-6rem] top-8 h-52 w-52 rounded-full bg-brand-accent-emerald/12 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Help & onboarding</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text-primary">Quick help for first uploads</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
              What EarnSigma does, what to upload today, and what to expect after validation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/data" className={buttonClassName({ variant: "primary", size: "sm", className: "shadow-brand-glow" })}>
              Upload data
            </Link>
            <Link
              href="/app"
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
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(0,0.85fr)]">
        <PanelCard
          title="Quick orientation"
          description="The short version of how the product behaves today."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))]"
          contentClassName="space-y-4"
        >
          <div className="space-y-3" data-testid="help-page-how-it-works">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Upload a supported CSV export, let EarnSigma validate it, then review the dashboard and latest report once the workspace is ready.
            </p>
            <ol className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
              <li>1. Upload a supported revenue export.</li>
              <li>2. Validation runs first, then processing continues when report generation is available for your plan.</li>
              <li>3. The dashboard and latest report update when processing completes.</li>
            </ol>
          </div>

          <div className="grid gap-3 md:grid-cols-2" data-testid="help-page-mode-guide">
            <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Earn</p>
              <p className="mt-2 text-sm font-semibold text-brand-text-primary">Revenue and monetization health</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Earn covers revenue, subscriptions, member value, and the clearest business signal from the latest report.
              </p>
            </article>
            <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Grow</p>
              <p className="mt-2 text-sm font-semibold text-brand-text-primary">Audience and engagement side</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Grow focuses on audience momentum and engagement. Richer scorecards appear when supported analytics are available.
              </p>
            </article>
          </div>
        </PanelCard>

        <PanelCard
          title="Upload guide"
          description="Keep expectations aligned with current support."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(18,38,73,0.92),rgba(12,27,53,0.96))]"
          contentClassName="space-y-4"
        >
          <div id="upload-guide" data-testid="help-page-upload-guide">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Currently supported uploads are {supportedRevenueUploads}. Start with the export that best reflects your latest revenue and subscriber data.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
              If you are looking for Grow depth, keep expectations light until supported audience and engagement analytics are available.
            </p>
          </div>

          <div id="after-upload" className="space-y-2" data-testid="help-page-after-upload">
            <p className="text-sm leading-relaxed text-brand-text-secondary">After upload, CSV validation runs first.</p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              If report generation is enabled for your plan, processing continues until a report is ready and the dashboard refreshes with the latest workspace evidence.
            </p>
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Need help uploading?"
        description="Use the lightest troubleshooting path first."
        className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.9),rgba(16,32,67,0.96))]"
        contentClassName="space-y-3"
      >
        <div data-testid="help-page-troubleshooting">
          <ul className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
            <li>Export a fresh CSV directly from the platform you selected.</li>
            <li>Retry the upload status check if processing takes longer than expected.</li>
            <li>Use the upload screen diagnostics tools before starting over if you need a failure record.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app/data" className={buttonClassName({ variant: "primary", size: "sm", className: "shadow-brand-glow" })}>
              Open upload flow
            </Link>
            <Link
              href="/app/data#upload-guide"
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "border-brand-border-strong/75 bg-brand-panel/75 shadow-brand-card hover:bg-brand-panel-muted/90",
              })}
            >
              Review upload guide
            </Link>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
