import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import { PanelCard } from "@/src/components/ui/panel-card";
import { getSupportedRevenueUploadFormatGuidance, getSupportedRevenueUploadSummary } from "@/src/lib/upload/platform-guidance";
import { getFallbackVisibleUploadPlatformCards } from "@/src/lib/upload/support-surface";

const supportedRevenueUploads = getSupportedRevenueUploadSummary();
const supportedRevenueUploadFormatGuidance = getSupportedRevenueUploadFormatGuidance();
const supportedRevenueUploadCards = getFallbackVisibleUploadPlatformCards();
const csvOnlyUploadCards = supportedRevenueUploadCards.filter((card) => card.importMode === "direct_csv");
const csvOrZipUploadCards = supportedRevenueUploadCards.filter((card) => card.importMode === "csv_or_zip");
const allowlistedZipUploadCards = supportedRevenueUploadCards.filter((card) => card.importMode === "allowlisted_zip");

const filePreparationItems = [
  "Upload the correct file under the matching platform before you start validation.",
  "Patreon and Substack use native CSV exports.",
  "YouTube uses a native analytics CSV or supported Takeout ZIP.",
  "Instagram and TikTok require the allowlisted ZIP export — not every ZIP from these platforms will work.",
  "Include at least 3 months of data where possible for a more useful report.",
  "Keep file contents clean and consistent, and do not rename required columns.",
];

const commonUploadProblems = [
  {
    title: "Wrong platform selected",
    body: "Go back, choose the platform that matches the file, and upload again.",
  },
  {
    title: "Unsupported ZIP format",
    body: "EarnSigma accepts only specific allowlisted ZIP exports for each platform. Ensure the ZIP matches the exact supported export shape for the platform you selected.",
  },
  {
    title: "Unreadable ZIP file",
    body: "Retry with the original unmodified ZIP export. If it still fails, check that the ZIP is the exact platform export and not a renamed or repackaged file.",
  },
  {
    title: "Malformed CSV",
    body: "Re-export the CSV without renaming required columns. Use the native platform CSV export without modification.",
  },
  {
    title: "Missing required data",
    body: "Use a file that includes the required columns, rows, and content for the platform you selected.",
  },
  {
    title: "Rejected upload after validation",
    body: "Retry with the supported import for that platform. If the file still fails, confirm the platform selection before uploading again.",
  },
  {
    title: "File accepted but report not ready yet",
    body: "Validation finished, but processing may still be running. Retry the upload status check before starting over.",
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
        answer: "EarnSigma currently supports Patreon, Substack, YouTube, Instagram Performance, and TikTok Performance.",
      },
      {
        question: "What file types can I upload?",
        answer:
          "Patreon and Substack use native CSV exports. YouTube uses a native analytics CSV or supported Takeout ZIP. Instagram Performance and TikTok Performance use allowlisted ZIP exports only. Not every CSV or ZIP from a platform will work.",
      },
      {
        question: "Do I need a CSV or a ZIP?",
        answer:
          "It depends on the platform. Patreon and Substack are CSV only. YouTube accepts a CSV or Takeout ZIP. Instagram and TikTok require the specific allowlisted ZIP export format.",
      },
      {
        question: "How much data should I upload?",
        answer: "Upload the most complete recent data you have. At least 3 months is recommended when possible for a more useful report.",
      },
      {
        question: "Do I need three months of data?",
        answer: "No. You can upload less, but at least 3 months is recommended when possible for more useful reporting.",
      },
      {
        question: "What happens after I upload my files?",
        answer:
          "EarnSigma validates and stages each supported source first. Upload completion does not create a report. When you are ready, click Run Report to combine your staged sources into one report.",
      },
      {
        question: "What kind of report will I get after I click Run Report?",
        answer:
          "After you click Run Report, EarnSigma generates one combined report from all eligible staged READY sources in your workspace, focused on supported revenue, subscriptions, and other measured business signals.",
      },
    ],
  },
  {
    title: "Platform-specific",
    items: [
      {
        question: "How do I upload Patreon data?",
        answer: "Choose Patreon in the upload flow, then upload the supported Patreon CSV.",
      },
      {
        question: "How do I upload Substack data?",
        answer: "Choose Substack in the upload flow, then upload the supported Substack CSV.",
      },
      {
        question: "How do I upload YouTube data?",
        answer: "Choose YouTube in the upload flow, then upload the native YouTube analytics CSV or a supported YouTube Takeout ZIP.",
      },
      {
        question: "How do I upload Instagram Performance data?",
        answer:
          "Choose Instagram Performance, then upload the supported Instagram export ZIP in the exact allowed format. Only the specific allowlisted ZIP shape is accepted.",
      },
      {
        question: "How do I upload TikTok Performance data?",
        answer:
          "Choose TikTok Performance, then upload the supported TikTok export ZIP in the exact allowed format. Only the specific allowlisted ZIP shape is accepted.",
      },
    ],
  },
  {
    title: "ZIP-specific",
    items: [
      {
        question: "Can I upload any Instagram ZIP export?",
        answer: "No. Only the specific allowlisted ZIP export shape is accepted for Instagram Performance. Not every ZIP from Instagram will work.",
      },
      {
        question: "Can I upload any TikTok ZIP export?",
        answer: "No. Only the specific allowlisted ZIP export shape is accepted for TikTok Performance. Not every ZIP from TikTok will work.",
      },
      {
        question: "Why was my ZIP file rejected?",
        answer:
          "Most ZIP rejections mean the file is not one of the selected supported ZIP formats, the ZIP could not be read, or it does not match the platform you selected.",
      },
      {
        question: 'What does "This ZIP format does not match the platform you selected" mean?',
        answer: "The ZIP file does not match the platform you chose in the upload flow. Select the matching platform or retry with a supported CSV.",
      },
    ],
  },
  {
    title: "Failure recovery",
    items: [
      {
        question: "What should I do if my upload fails?",
        answer: "Confirm that you selected the matching platform, then retry with the supported file type for that platform. For YouTube, a native analytics CSV is an alternative to the Takeout ZIP. For Instagram Performance and TikTok Performance, only the specific allowlisted ZIP is supported.",
      },
      {
        question: "What if I selected the wrong platform?",
        answer: "Go back, choose the correct platform, and upload the file again.",
      },
      {
        question: "What if my file is missing required columns or content?",
        answer: "Use the native platform export without renaming or removing required columns. EarnSigma validates the specific export format for each platform.",
      },
      {
        question: "What should I use if my ZIP is not supported?",
        answer: "For YouTube, a native analytics CSV is an alternative to the Takeout ZIP. For Patreon and Substack, native CSV is the supported format. Instagram Performance and TikTok Performance accept only the specific allowlisted ZIP — there is no CSV fallback for these platforms.",
      },
    ],
  },
  {
    title: "Scope and expectations",
    items: [
      {
        question: "Does EarnSigma support Stripe uploads?",
        answer: "No. Stripe self-serve imports are not supported in MVP v1.",
      },
      {
        question: "Does EarnSigma support sponsorship or brand-deal imports?",
        answer: "No. Sponsorship and brand-deal automation are not supported in MVP v1.",
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
              What EarnSigma supports today, how to prepare your files, and how to recover from common upload issues.
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
          description="The short version of how self-service onboarding works today."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(19,41,80,0.92),rgba(16,32,67,0.96))]"
          contentClassName="space-y-4"
        >
          <div className="space-y-3" data-testid="help-page-how-it-works">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Upload supported files, let EarnSigma validate and stage them, then run one combined report when your workspace is ready.
            </p>
            <ol className="space-y-2 text-sm leading-relaxed text-brand-text-secondary">
              <li>1. Choose the platform that matches your file.</li>
              <li>2. Upload the supported file: CSV for Patreon and Substack, CSV or Takeout ZIP for YouTube, or allowlisted ZIP for Instagram and TikTok.</li>
              <li>3. Validation and ingestion run first so the source becomes staged in your workspace.</li>
              <li>4. Click Run Report when you want to generate the latest combined report and refresh the dashboard.</li>
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
          title="Supported imports"
          description="Exact file types currently accepted in MVP v1."
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

            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">CSV only</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-text-secondary">
                  {csvOnlyUploadCards.map((card) => (
                    <li key={card.id}>
                      <span className="font-medium text-brand-text-primary">{card.label}:</span> native CSV
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">CSV or ZIP</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-text-secondary">
                  {csvOrZipUploadCards.map((card) => (
                    <li key={card.id}>
                      <span className="font-medium text-brand-text-primary">{card.label}:</span> analytics CSV or Takeout ZIP
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Allowlisted ZIP</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-text-secondary">
                  {allowlistedZipUploadCards.map((card) => (
                    <li key={card.id}>
                      <span className="font-medium text-brand-text-primary">{card.label}:</span> allowlisted ZIP export
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="rounded-[1.05rem] border border-brand-border/75 bg-brand-panel/78 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Important ZIP note</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                EarnSigma accepts only specific allowlisted ZIP formats. Not every ZIP from a platform will work.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                If a ZIP is rejected, confirm it is the exact supported export shape for the platform you selected.
              </p>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <PanelCard
          title="How to prepare your files"
          description="Use the matching platform and clean source files before you upload."
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
          description="What to expect from validation, processing, and report readiness."
          className="border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(18,38,73,0.92),rgba(12,27,53,0.96))]"
          contentClassName="space-y-3"
        >
          <div id="after-upload" className="space-y-2" data-testid="help-page-after-upload">
            <p className="text-sm leading-relaxed text-brand-text-secondary">After upload, validation and ingestion run first.</p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              If the file passes, EarnSigma stages that source in your workspace. Upload completion does not create a report.
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              When you click Run Report, EarnSigma generates one combined report from all eligible staged READY sources in the workspace.
            </p>
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              If you are looking for Grow depth, keep expectations light until supported audience and engagement analytics are available.
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
        description="Current MVP v1 limits to keep support expectations accurate."
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
              Review upload guide
            </Link>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
