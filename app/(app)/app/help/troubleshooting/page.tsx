import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";

type TroubleshootingSection = {
  id: string;
  heading: string;
  items: { title: string; body: string }[];
};

const SECTIONS: TroubleshootingSection[] = [
  {
    id: "upload-failed",
    heading: "Upload failed",
    items: [
      {
        title: "Wrong file type",
        body: "Each platform expects a specific format. Patreon and Substack require the EarnSigma CSV template. YouTube, TikTok, and Instagram require native platform exports — not third-party downloads.",
      },
      {
        title: "File is too large or empty",
        body: "Exports with no rows or a single header row are rejected. Check that your export covers real activity and is not a blank template.",
      },
      {
        title: "Encoding or formatting issue",
        body: "Save CSV files as UTF-8. Files exported from Excel with special characters or locale-specific separators may fail validation.",
      },
      {
        title: "Duplicate upload",
        body: "If you re-upload the same file within the same session, the duplicate is ignored. Upload a fresh export if your data has not changed.",
      },
    ],
  },
  {
    id: "unsupported-formats",
    heading: "Unsupported file formats",
    items: [
      {
        title: "PDF, image, or Excel files",
        body: "Only CSV and ZIP files are accepted. Export your data directly from the platform and save it as CSV before uploading.",
      },
      {
        title: "Google Takeout",
        body: "Google Takeout exports are not supported. Use YouTube Studio to export your channel analytics instead.",
      },
      {
        title: "Third-party aggregators",
        body: "Files downloaded from analytics tools that aggregate your data are not supported. Upload the original platform export directly.",
      },
    ],
  },
  {
    id: "zip-issues",
    heading: "ZIP upload issues",
    items: [
      {
        title: "ZIP contains unsupported content",
        body: "Only ZIPs that match the exact structure of a supported native export are accepted. A ZIP with mixed files, extra folders, or non-platform content will be rejected.",
      },
      {
        title: "ZIP is password-protected or corrupted",
        body: "Download a fresh export from the platform. Do not re-compress or modify the ZIP after downloading.",
      },
      {
        title: "Wrong platform ZIP",
        body: "Instagram, TikTok, and YouTube each produce distinct ZIP structures. Make sure you are uploading the export from the correct platform.",
      },
    ],
  },
  {
    id: "report-looks-wrong",
    heading: "Report generated but looks wrong",
    items: [
      {
        title: "Metrics are lower than expected",
        body: "Check that your export covers the full date range you intended. Platform exports sometimes default to a short window such as the last 28 days.",
      },
      {
        title: "Some platforms are missing",
        body: "Each platform must be uploaded separately. If you only uploaded one source, only that source appears in the report.",
      },
      {
        title: "Revenue is zero or missing",
        body: "Revenue data comes from Patreon or Substack exports. If those are not uploaded, the report generates from growth-only sources and will not include revenue.",
      },
      {
        title: "Creator score seems off",
        body: "The score is based on the evidence in the uploaded files. A single short export or sparse subscriber data limits the score. Upload more coverage to improve confidence.",
      },
    ],
  },
  {
    id: "no-data-detected",
    heading: "No data detected",
    items: [
      {
        title: "Header row only",
        body: "If your export contains only a header row and no data rows, it will pass the file check but produce no usable results. Re-export from the platform with a longer date range.",
      },
      {
        title: "Wrong sheet or tab exported",
        body: "Some platforms show multiple sheets. Make sure you are exporting the sheet that contains your subscriber or revenue data, not a summary or totals-only view.",
      },
      {
        title: "Date range is too narrow",
        body: "Reports require at least some activity across the coverage period. A one-day or one-week export may not contain enough signal to produce a meaningful report.",
      },
    ],
  },
];

function SectionItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/60 p-4">
      <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{body}</p>
    </div>
  );
}

export default function TroubleshootingPage() {
  return (
    <div className="space-y-6" data-testid="troubleshooting-page-shell">
      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-brand-border-strong/70 bg-[linear-gradient(145deg,rgba(10,24,50,0.96),rgba(15,35,75,0.94),rgba(12,27,54,0.98))] px-6 py-6 shadow-brand-card"
        data-testid="troubleshooting-page-hero"
      >
        <div className="pointer-events-none absolute -left-24 top-[-5rem] h-64 w-64 rounded-full bg-brand-accent-blue/18 blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-8 h-56 w-56 rounded-full bg-brand-accent-amber/10 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Troubleshooting</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-text-primary sm:text-[2.1rem]">
            Something not working?
          </h1>
          <p className="mt-4 text-sm leading-6 text-brand-text-muted">
            Check the section that matches your issue. Most upload and report problems have a clear fix.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/app/help"
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "border-brand-border-strong/75 bg-brand-panel/75 shadow-brand-card hover:bg-brand-panel-muted/90",
              })}
            >
              Upload guide
            </Link>
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
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="space-y-3"
          data-testid={`troubleshooting-section-${section.id}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">{section.heading}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {section.items.map((item) => (
              <SectionItem key={item.title} title={item.title} body={item.body} />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-[1.5rem] border border-brand-border/70 bg-brand-panel/55 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Still stuck?</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
          If none of the above resolves your issue, check the{" "}
          <Link href="/app/help" className="font-medium text-brand-text-primary underline underline-offset-4 hover:text-brand-accent-teal">
            Upload Guide
          </Link>{" "}
          for per-platform format details, or revisit the platform export settings to ensure the correct date range and export type were selected.
        </p>
      </section>
    </div>
  );
}
