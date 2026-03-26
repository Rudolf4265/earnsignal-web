import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import {
  getStaticSourceManifestSnapshot,
  getStaticVisibleUploadPlatformCards,
  getSupportedRevenueUploadFormatGuidanceFromCards,
  getSupportedRevenueUploadSummaryFromCards,
} from "@/src/lib/upload/support-surface";

const sourceManifest = getStaticSourceManifestSnapshot();
const supportedUploadCards = getStaticVisibleUploadPlatformCards();
const supportedRevenueUploads = getSupportedRevenueUploadSummaryFromCards(supportedUploadCards);
const supportedRevenueUploadFormatGuidance = getSupportedRevenueUploadFormatGuidanceFromCards(supportedUploadCards);
const reportDrivingUploads = getSupportedRevenueUploadSummaryFromCards(
  supportedUploadCards.filter((card) => card.platformRole === "report-driving"),
);
const supportingUploads = getSupportedRevenueUploadSummaryFromCards(
  supportedUploadCards.filter((card) => card.platformRole === "supporting"),
);

const filePreparationItems = [
  "Choose the platform that matches the file before you start validation.",
  "Use only the exact supported file types shown in the workspace and help guide.",
  supportedRevenueUploadFormatGuidance,
  `Report-driving sources: ${reportDrivingUploads}. Supporting sources: ${supportingUploads}.`,
  "At least 3 months of data is helpful when you want a stronger report.",
];

const commonUploadProblems = [
  {
    title: "Wrong platform selected",
    body: "Go back, choose the platform that matches the file, and upload again.",
  },
  {
    title: "Unsupported file format",
    body: "Use the accepted format shown for that platform. If a ZIP is rejected, it usually does not match the allowlisted archive shape.",
  },
  {
    title: "Malformed CSV",
    body: "Retry with the exact supported CSV contract for that platform. Avoid renaming or restructuring the file.",
  },
  {
    title: "Missing required data",
    body: "Use a file that contains the required rows and columns for that supported contract.",
  },
  {
    title: "File accepted but report not ready",
    body: "Upload completion stages a source. Reports are generated only when you explicitly click Run Report from a workspace that is eligible.",
  },
];

const faqSections: Array<{
  title: string;
  items: Array<{ question: string; answer: string }>;
}> = [
  {
    title: "General",
    items: [
      {
        question: "What platforms does EarnSigma support?",
        answer: `EarnSigma currently supports ${supportedRevenueUploads}.`,
      },
      {
        question: "What file types can I upload?",
        answer: supportedRevenueUploadFormatGuidance,
      },
      {
        question: "What happens after I upload files?",
        answer: "EarnSigma validates and stages each source first. Upload completion does not generate a report. When your workspace is eligible, you can run one combined report from the staged snapshot.",
      },
      {
        question: "What kind of report will I get after I click Run Report?",
        answer: "EarnSigma generates one combined report from the eligible staged workspace sources, focused on revenue, subscriber health, platform risk, and next actions.",
      },
    ],
  },
  {
    title: "Platform-specific",
    items: supportedUploadCards.map((card) => ({
      question: `How do I upload ${card.label} data?`,
      answer: `Choose ${card.label} in the upload flow, then use the supported file type shown for that source. ${card.guidance}`,
    })),
  },
  {
    title: "Eligibility and readiness",
    items: [
      {
        question: "Why can’t I run a report yet?",
        answer: `${sourceManifest.eligibilityRule} Supporting sources such as ${supportingUploads} add context but cannot generate one alone.`,
      },
      {
        question: "What makes a report stronger?",
        answer: `${sourceManifest.businessMetricsRule} Performance-only support data can enrich a report but does not replace business metrics.`,
      },
      {
        question: "What does 'What this report is based on' mean?",
        answer: "Before and after report generation, EarnSigma shows which staged sources were included, what role they play, and where insight is limited by available business metrics.",
      },
    ],
  },
  {
    title: "Scope and expectations",
    items: [
      {
        question: "Does EarnSigma support Stripe uploads?",
        answer: "No. Stripe self-serve imports are not part of the public MVP support surface.",
      },
      {
        question: "Does EarnSigma support sponsorship or brand-deal imports?",
        answer: "No. Sponsorship and brand-deal automation are not part of the public MVP support surface.",
      },
      {
        question: "Can I upload any creator export bundle?",
        answer: "No. Generic ZIP uploads, arbitrary archive parsing, and unsupported creator export bundles are not part of MVP v1.",
      },
    ],
  },
];

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
              Current source support, file prep guidance, report-readiness rules, and common failure recovery steps.
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
          description="The short version of how workspace-based onboarding works today."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))]"
          contentClassName="space-y-4"
        >
          <div className="space-y-3" data-testid="help-page-how-it-works">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Upload supported files, let EarnSigma validate and stage them, then run one combined report when your workspace is ready.
            </p>
            <ol className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
              <li>1. Choose the platform that matches your file.</li>
              <li>2. Upload the supported file type shown for that source.</li>
              <li>3. Validation and ingestion run first so the source becomes staged in your workspace.</li>
              <li>4. Click Run Report when you want to generate the latest combined report from the staged snapshot.</li>
            </ol>
          </div>

          <div className="grid gap-3 md:grid-cols-2" data-testid="help-page-mode-guide">
            <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Earn</p>
              <p className="mt-2 text-sm font-semibold text-brand-text-primary">Private creator business diagnostics</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Earn covers revenue, subscriptions, platform risk, and the clearest business signal from the latest report.
              </p>
            </article>
            <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Grow</p>
              <p className="mt-2 text-sm font-semibold text-brand-text-primary">Audience and engagement side</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Grow focuses on audience momentum and engagement. Richer scorecards appear as more supported analytics become available.
              </p>
            </article>
          </div>
        </PanelCard>

        <PanelCard
          title="Supported imports"
          description="Current public support comes from the canonical source manifest."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(18,38,73,0.92),rgba(12,27,53,0.96))]"
          contentClassName="space-y-4"
        >
          <div id="upload-guide" className="space-y-4" data-testid="help-page-upload-guide">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Currently supported uploads are {supportedRevenueUploads}.
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {supportedRevenueUploadFormatGuidance}
            </p>

            <div className="grid gap-3">
              {supportedUploadCards.map((card) => (
                <article key={card.id} className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-brand-text-primary">{card.label}</p>
                    <span className="rounded-full border border-brand-border/75 bg-brand-panel-muted/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">
                      {card.platformRole === "report-driving" ? "Primary" : "Supporting"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{card.guidance}</p>
                  <p className="mt-2 text-xs text-brand-text-muted">Accepted format: {card.fileTypeLabel}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Important note</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Not every CSV or ZIP exported from a platform will match the supported contract. EarnSigma is intentionally narrow and explicit here to keep reports trustworthy.
              </p>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <PanelCard
          title="How to prepare your files"
          description="Use the matching platform and supported source files before you upload."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))]"
          contentClassName="space-y-3"
        >
          <div data-testid="help-page-file-prep">
            <ul className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
              {filePreparationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </PanelCard>

        <PanelCard
          title="What happens after upload"
          description="What to expect from validation, staging, and report readiness."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(18,38,73,0.92),rgba(12,27,53,0.96))]"
          contentClassName="space-y-3"
        >
          <div id="after-upload" className="space-y-2" data-testid="help-page-after-upload">
            <p className="text-sm leading-relaxed text-brand-text-secondary">After upload, validation and ingestion run first.</p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              If the file passes, EarnSigma stages that source in your workspace. Upload completion does not create a report.
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              When you click Run Report, EarnSigma generates one combined report from all eligible staged sources in the current workspace snapshot.
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Trust copy such as coverage notes, business-metrics strength, and section-level limitations comes from the report payload itself.
            </p>
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Frequently asked questions"
        description="Short answers for self-service onboarding."
        className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.9),rgba(16,32,67,0.96))]"
        contentClassName="space-y-6"
      >
        <div className="space-y-6" data-testid="help-page-faq">
          {faqSections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-brand-text-primary">{section.title}</h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {section.items.map((item) => (
                  <article key={item.question} className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
                    <h4 className="text-sm font-semibold text-brand-text-primary">{item.question}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PanelCard>

      <PanelCard
        title="Common upload problems"
        description="Plain-language recovery steps for the most common failures."
        className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.9),rgba(16,32,67,0.96))]"
        contentClassName="space-y-3"
      >
        <div className="grid gap-3 lg:grid-cols-2" data-testid="help-page-troubleshooting">
          {commonUploadProblems.map((problem) => (
            <article key={problem.title} className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <h3 className="text-sm font-semibold text-brand-text-primary">{problem.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{problem.body}</p>
            </article>
          ))}
        </div>
      </PanelCard>

      <PanelCard
        title="What is not supported yet"
        description="Current MVP v1 limits to keep expectations accurate."
        className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.9),rgba(16,32,67,0.96))]"
        contentClassName="space-y-3"
      >
        <div className="space-y-3" data-testid="help-page-not-supported">
          <ul className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
            <li>Generic ZIP uploads and arbitrary archive parsing.</li>
            <li>Upload-anything workflows.</li>
            <li>Stripe self-serve imports.</li>
            <li>Sponsorship or brand-deal automation.</li>
            <li>Unsupported creator export bundles.</li>
            <li>Any unsupported platform not listed in Supported imports.</li>
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
              Review supported imports
            </Link>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
