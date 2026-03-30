"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUploadPresign,
  finalizeUploadCallback,
  getLatestUploadStatus,
  getUploadStatus,
  uploadFileToPresignedUrl,
  type UploadPlatform,
} from "@/src/lib/api/upload";
import { pollUploadStatus, UploadPollingCancelledError } from "@/src/lib/upload/polling";
import { mapApiErrorToUploadFailure } from "@/src/lib/upload/errors";
import { buildUploadDiagnostics, mapUploadStatus, type UploadStatusEnvelope, type UploadUiStatus } from "@/src/lib/upload/status";
import { clearUploadResume, readUploadResume, writeUploadResume } from "@/src/lib/upload/resume";
import { computeSHA256Hex } from "@/src/lib/upload/checksum";
import {
  groupPlatformCards,
  type NormalizedSourceManifest,
  type UploadPlatformCardMetadata,
} from "@/src/lib/upload/platform-metadata";
import type { WorkspaceDataSource } from "@/src/lib/api/workspace";
import { detectPatreonExportType } from "@/src/lib/upload/patreon-csv-detector";
import { detectInstagramExportType } from "@/src/lib/upload/instagram-csv-detector";
import { extractInstagramZipBufferToUploadArtifact } from "@/src/lib/upload/instagram-zip-extractor";
import { extractTiktokZipBufferToUploadArtifact } from "@/src/lib/upload/tiktok-zip-extractor";
import { inspectZipArchiveBuffer, isZipUploadCandidate, toZipUploadRejection } from "@/src/lib/upload/zip-intake";
import { createReportRun, getReportErrorMessage } from "@/src/lib/api/reports";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import type { WorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import { useEntitlementState } from "../../../_components/use-entitlement-state";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import { ErrorBanner } from "@/src/components/ui/error-banner";

type Step = "platform" | "file" | "uploading" | "processing" | "done";

const stepOrder: Step[] = ["platform", "file", "uploading", "processing", "done"];
const RESUME_STATUS_TIMEOUT_MS = 2_500;

const readableFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Read the first line of a CSV file and return the header cells.
 * Reads only the first 8 KB so we never block the UI on large files.
 */
async function readCSVHeaders(file: File): Promise<string[]> {
  const slice = file.slice(0, 8192);
  const text = await slice.text();
  const firstLine = (text.split(/\r?\n/)[0] ?? "").trim();
  if (!firstLine) return [];

  // Basic quoted-CSV parser (handles quotes around individual cells)
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of firstLine) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.filter((h) => h.length > 0);
}

/**
 * Build an optional `client_context` JSON string that hints to the backend
 * which Patreon export sub-type was detected client-side.
 * Returns `undefined` if detection is inconclusive or not applicable.
 */
async function buildPatreonClientContext(file: File): Promise<string | undefined> {
  try {
    const headers = await readCSVHeaders(file);
    const detection = detectPatreonExportType(headers);
    if (detection.detected_export_type === "unknown") return undefined;
    return JSON.stringify({
      detected_export_type: detection.detected_export_type,
      confidence: Math.round(detection.confidence * 100) / 100,
    });
  } catch {
    // Non-fatal – proceed without the hint
    return undefined;
  }
}

/**
 * Build an optional `client_context` JSON string that hints to the backend
 * which Instagram export sub-type was detected client-side.
 * Returns `undefined` if detection is inconclusive or not applicable.
 */
async function buildInstagramClientContext(file: File): Promise<string | undefined> {
  try {
    const headers = await readCSVHeaders(file);
    const detection = detectInstagramExportType(headers);
    if (detection.detected_export_type === "unknown") return undefined;
    return JSON.stringify({
      detected_export_type: detection.detected_export_type,
      confidence: Math.round(detection.confidence * 100) / 100,
    });
  } catch {
    // Non-fatal – proceed without the hint
    return undefined;
  }
}

const friendlyFailureMessage = (reasonCode: string | null) => {
  if (
    reasonCode === "instagram_required_file_missing" ||
    reasonCode === "instagram_required_content_invalid" ||
    reasonCode === "instagram_supported_shape_but_unparseable" ||
    reasonCode === "instagram_normalization_failed"
  ) {
    return "This Instagram ZIP format couldn’t be imported. Check that it matches the exact supported export shape.";
  }

  if (
    reasonCode === "tiktok_required_file_missing" ||
    reasonCode === "tiktok_required_content_invalid" ||
    reasonCode === "tiktok_supported_shape_but_unparseable" ||
    reasonCode === "tiktok_normalization_failed"
  ) {
    return "This TikTok ZIP format couldn’t be imported. Check that it matches the exact supported export shape.";
  }

  if (
    reasonCode === "zip_not_importable" ||
    reasonCode === "candidate_zip_not_yet_supported" ||
    reasonCode === "ambiguous_archive_shape"
  ) {
    return "This ZIP export isn’t in one of the currently supported formats for this platform.";
  }

  if (
    reasonCode === "not_zip" ||
    reasonCode === "corrupt_archive" ||
    reasonCode === "encrypted_or_unreadable_archive"
  ) {
    return "We couldn’t read that ZIP file. Retry with the original unmodified export.";
  }

  if (reasonCode === "unsafe_archive_path" || reasonCode === "too_many_entries" || reasonCode === "archive_too_large") {
    return "This ZIP file was rejected by the bounded security check. Retry with the original platform export.";
  }

  // Backend validation reason codes (normalized to lowercase)
  const normalizedCode = reasonCode?.toLowerCase() ?? null;

  if (normalizedCode === "invalid_upload_platform") {
    return "This file looks like a valid export, but not for the platform you selected. Choose the matching platform and try again.";
  }

  if (normalizedCode === "schema_mismatch") {
    return "This file does not match one of the supported input contracts for this platform.";
  }

  if (normalizedCode === "recognized_not_implemented") {
    return "We recognized this export type, but it isn't supported yet in EarnSigma.";
  }

  if (normalizedCode === "unsupported_archive_shape") {
    return "This ZIP export isn’t in one of the currently supported formats for this platform.";
  }

  if (normalizedCode === "csv_validation_failed") {
    return "This file was recognized, but one or more required fields are missing or invalid.";
  }

  switch (reasonCode) {
    case "validation_failed":
      if (false) {
        return (
          "We couldn’t validate that Patreon CSV. Make sure you’re uploading the native Members export " +
          "(Patreon › Audience › Members › Export CSV), which includes columns like Patron Status, " +
          "Pledge Amount, and Patronage Since Date."
        );
      }
      return "This file was recognized, but one or more required fields are missing or invalid.";
    case "schema_mismatch_or_missing_columns":
      if (false) {
        return (
          "The CSV columns don’t match the expected Patreon Members export format. " +
          "Please use the native Members CSV export from Patreon › Audience › Members › Export CSV. " +
          "This file should include columns like Patron Status, Pledge Amount, and Patronage Since Date."
        );
      }
      return "This file does not match one of the supported input contracts for this platform.";
    case "recognized_not_implemented":
      return "We recognized this export type, but it isn't supported yet in EarnSigma.";
    case "candidate_zip_not_yet_supported":
      return "This ZIP export isn’t in one of the currently supported formats for this platform.";
    case "not_zip":
      return "We couldn’t read that ZIP file. Retry with the original unmodified export.";
    case "corrupt_archive":
      return "We couldn’t read that ZIP archive. Retry with the original unmodified export.";
    case "encrypted_or_unreadable_archive":
      return "Encrypted ZIP archives are not accepted. Retry with the original unencrypted platform export.";
    case "unsafe_archive_path":
      return "This ZIP archive contains unsafe paths and was rejected before upload.";
    case "unsupported_archive_shape":
      return "This ZIP export isn’t in one of the currently supported formats for this platform.";
    case "too_many_entries":
      return "This ZIP archive exceeds the entry-count limit and was rejected.";
    case "archive_too_large":
      return "This ZIP archive exceeds the size limit and was rejected.";
    case "ambiguous_archive_shape":
      return "This ZIP export isn’t in one of the currently supported formats for this platform.";
    case "network_error":
      return "We couldn’t reach the server. Please retry. Your upload may still be processing — refresh staged sources in a few moments if the error persists.";
    case "ingest_failed":
      return "We couldn’t ingest the file right now. Please retry in a moment.";
    case "report_failed":
      return "A report run failed. Retry from the workspace when your staged sources are ready.";
    case "session_expired":
      return "Your session expired while checking upload status. Please log in again.";
    case "upload_not_found":
      return "We couldn’t find that previous upload anymore. Please reset and upload again.";
    case "timeout":
      return "This upload is still processing and timed out in the dashboard. You can retry status checks or reset.";
    case "entitlement_required":
      return "Paid report generation requires Report or Pro access. Upgrade in Billing to continue.";
    default:
      return "We couldn’t complete processing for this upload yet.";
  }
};

// Per-platform file guidance shown in the file upload step.
// All steps map to official export flows — do not invent formats.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PLATFORM_FILE_GUIDANCE: Partial<Record<UploadPlatform, { getFile: string; formatNote: string }>> = {
  patreon: {
    getFile: "In Patreon: go to Audience → Members → Export CSV. Use the native Members export only — do not rename or reformat columns.",
    formatNote: "Native Patreon Members CSV. Columns like Patron Status, Pledge Amount, and Patronage Since Date must be present.",
  },
  substack: {
    getFile: "In Substack: go to Settings → Subscribers → Export. Download the subscriber CSV directly.",
    formatNote: "Native Substack subscriber CSV export.",
  },
  youtube: {
    getFile: "In YouTube Studio: Analytics → Advanced Mode → Export current view. Or export via Google Takeout (youtube_watch_history or channel analytics).",
    formatNote: "YouTube Analytics CSV or a supported YouTube Takeout ZIP. Not all Takeout ZIPs will be accepted.",
  },
  instagram: {
    getFile: "In Instagram: Settings → Your activity → Download your information. Select the specific export type that matches the allowlisted shape.",
    formatNote: "Allowlisted ZIP export only. Not every Instagram data export will be accepted — only specific export shapes are supported.",
  },
  tiktok: {
    getFile: "In TikTok: Settings → Privacy → Personalization and data → Download your data. Request the data export and download the ZIP when ready.",
    formatNote: "Allowlisted ZIP export only. Not every TikTok data export will be accepted — only specific export shapes are supported.",
  },
};

// Extremely subtle brand-tinted dark chips — 9% opacity tint on both light and dark card surfaces.
// On unselected (white) cards the tint reads as a soft warm/cool cast; on selected (dark navy) cards
// the same value blends into the deep background. Both states benefit without being sticker-like.
function buildFileInputAccept(card: UploadPlatformCardMetadata | null): string {
  const accepted = new Set<string>();

  if (card?.acceptedExtensions.includes(".csv")) {
    accepted.add(".csv");
    accepted.add("text/csv");
  }

  if (card?.acceptedExtensions.includes(".zip")) {
    accepted.add(".zip");
    accepted.add("application/zip");
  }

  return accepted.size > 0 ? [...accepted].join(",") : ".csv,text/csv";
}

function buildUploadRecognitionMessage(
  source: WorkspaceDataSource | null | undefined,
  selectedPlatformCard: UploadPlatformCardMetadata | null,
): string {
  if (source) {
    return `${source.label} recognized. ${source.roleSummary} ${
      source.includedInNextReport ? "Included in your next combined report." : "Ready for review in the workspace."
    }`;
  }

  if (selectedPlatformCard) {
    return `${selectedPlatformCard.label} recognized. ${selectedPlatformCard.roleSummary}`;
  }

  return "Your source was recognized and added to the workspace.";
}

const PLATFORM_LOGO_BUBBLE: Record<string, { bg: string; ring: string }> = {
  patreon:   { bg: "bg-[rgba(248,67,20,0.09)]",  ring: "ring-[rgba(248,67,20,0.18)]" },
  substack:  { bg: "bg-[rgba(255,104,31,0.09)]", ring: "ring-[rgba(255,104,31,0.18)]" },
  youtube:   { bg: "bg-[rgba(255,0,0,0.08)]",    ring: "ring-[rgba(255,0,0,0.16)]" },
  instagram: { bg: "bg-[rgba(193,53,132,0.09)]", ring: "ring-[rgba(193,53,132,0.18)]" },
  tiktok:    { bg: "bg-[rgba(37,244,238,0.10)]", ring: "ring-[rgba(37,244,238,0.18)]" },
};

type UploadPlatformCardProps = {
  label: string;
  description: string;
  icon: string;
  available: boolean;
  selected: boolean;
  onClick: () => void;
  testId?: string;
  platformId?: string;
};

function UploadFlowHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">Add or replace a source</h2>
        <p className="mt-1 text-sm text-slate-400">Choose a platform, then upload a supported file.</p>
      </div>
      <Link href="/app/help#upload-guide" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
        Open upload guide
      </Link>
    </div>
  );
}

function UploadPrivacyLine() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
      <span className="inline-flex items-center gap-2 text-slate-300">
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        Your data stays private
      </span>
      <span className="hidden text-slate-600 sm:inline">|</span>
      <span>Used only to generate reports and operate the service.</span>
      <Link href="/data-privacy" className="text-slate-300 underline underline-offset-4 transition hover:text-white">
        Learn more
      </Link>
    </div>
  );
}

function UploadPlatformCard({ label, description, icon, available, selected, onClick, testId, platformId }: UploadPlatformCardProps) {
  const tint = PLATFORM_LOGO_BUBBLE[platformId ?? ""];
  const bubbleClass = tint
    ? [
        tint.bg,
        "ring-1",
        selected ? "ring-blue-400/[0.22]" : tint.ring,
      ].join(" ")
    : selected
      ? "bg-white/[0.06] ring-1 ring-blue-400/[0.2]"
      : "bg-slate-100/70 ring-1 ring-black/[0.07]";

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!available}
      onClick={onClick}
      className={[
        "group flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081325]",
        available
          ? selected
            ? "cursor-pointer border-blue-400/50 bg-blue-500/[0.08] shadow-[0_0_24px_-10px_rgba(59,130,246,0.75)]"
            : "cursor-pointer border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.03]"
          : "cursor-not-allowed border-white/8 bg-white/[0.02] opacity-55",
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bubbleClass}`}>
          <Image
            src={icon}
            alt={`${label} logo`}
            width={20}
            height={20}
            className="platform-icon block h-5 w-5 object-contain"
          />
        </span>
        {selected ? (
          <span className="inline-flex items-center rounded-full bg-blue-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-200">
            Selected
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-white">{label}</p>
        <p className={`text-sm leading-snug ${selected ? "text-slate-300/85" : "text-slate-400"}`}>{description}</p>
      </div>
    </button>
  );
}

function UploadPlatformPicker({
  platformSections,
  showPlatformSectionHeading,
  platform,
  onSelect,
}: {
  platformSections: Array<{
    category: string;
    label: string;
    items: UploadPlatformCardMetadata[];
  }>;
  showPlatformSectionHeading: boolean;
  platform: UploadPlatform | null;
  onSelect: (platform: UploadPlatform) => void;
}) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5" data-testid="upload-platform-guide">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Choose platform</h3>
          <p className="mt-1 text-sm text-slate-400">Select the source you want to upload.</p>
        </div>
        <Link href="/app/help#upload-guide" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
          Need format rules?
        </Link>
      </div>

      {platformSections.map((section) => (
        <section key={section.category} className="space-y-2" data-testid={`platform-section-${section.category}`}>
          {showPlatformSectionHeading ? <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{section.label}</h3> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item) => {
              const selected = platform === item.id;
              return (
                <UploadPlatformCard
                  key={item.id}
                  label={item.label}
                  description={item.subtitle}
                  icon={item.icon}
                  available={item.available}
                  selected={selected}
                  onClick={() => {
                    if (!item.available) return;
                    onSelect(item.id);
                  }}
                  testId={`platform-card-${item.id}`}
                  platformId={item.id}
                />
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

function UploadPrimaryFooterBar({
  canContinue,
  onContinue,
  onStartOver,
}: {
  canContinue: boolean;
  onContinue: () => void;
  onStartOver: () => void;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 border-t border-white/10 bg-[#081325]/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6"
      data-testid="upload-primary-footer-bar"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-400">Step 1 of 5</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onStartOver} className="text-sm font-medium text-slate-300 underline underline-offset-4 hover:text-white">
            Start over
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className={[
              "inline-flex h-12 min-w-[260px] items-center justify-center rounded-2xl px-5 text-base font-semibold transition",
              canContinue
                ? "bg-emerald-400 text-slate-950 shadow-[0_0_28px_-10px_rgba(52,211,153,0.95)] hover:bg-emerald-300"
                : "cursor-not-allowed bg-white/[0.05] text-slate-500",
            ].join(" ")}
          >
            {canContinue ? "Continue to file upload" : "Select platform to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function awaitWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{ timedOut: boolean; value: T | null }> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<{ type: "timeout" }>((resolve) => {
    timeoutHandle = setTimeout(() => resolve({ type: "timeout" }), timeoutMs);
  });

  const guardedPromise = promise
    .then((value) => ({ type: "resolved" as const, value }))
    .catch((error) => ({ type: "rejected" as const, error }));

  const outcome = await Promise.race([guardedPromise, timeoutPromise]);
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle);
  }

  if (outcome.type === "timeout") {
    return { timedOut: true, value: null };
  }

  if (outcome.type === "rejected") {
    throw outcome.error;
  }

  return { timedOut: false, value: outcome.value };
}

type UploadStepperProps = {
  sourceManifest: NormalizedSourceManifest;
  visiblePlatformCards: UploadPlatformCardMetadata[];
  workspaceReportState: WorkspaceReportState;
  refreshWorkspaceDataSources: () => Promise<void>;
  clearCurrentReport: () => void;
  onReportCreated: (reportId: string) => void;
  preferredPlatform?: UploadPlatform | null;
  preferredPlatformNonce?: number;
};

export default function UploadStepper({
  sourceManifest,
  visiblePlatformCards,
  workspaceReportState,
  refreshWorkspaceDataSources,
  clearCurrentReport,
  onReportCreated,
  preferredPlatform = null,
  preferredPlatformNonce = 0,
}: UploadStepperProps) {
  const router = useRouter();
  const entitlementState = useEntitlementState();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<UploadPlatform | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorOperation, setErrorOperation] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<UploadUiStatus | null>(null);
  const [hasResumeCandidate, setHasResumeCandidate] = useState(false);
  const [latestTerminalUpload, setLatestTerminalUpload] = useState<{
    status: UploadUiStatus;
    uploadId: string;
  } | null>(null);
  const [runReportBusy, setRunReportBusy] = useState(false);
  const [runReportError, setRunReportError] = useState<string | null>(null);

  const activeStepIndex = stepOrder.indexOf(step);
  const steps = useMemo(
    () => [
      { id: "platform", label: "Platform" },
      { id: "file", label: "File" },
      { id: "upload", label: "Upload" },
      { id: "processing", label: "Processing" },
      { id: "done", label: "Done" },
    ],
    [],
  );
  const platformSections = useMemo(() => groupPlatformCards(visiblePlatformCards), [visiblePlatformCards]);
  const showPlatformSectionHeading = platformSections.length > 1;
  const selectedPlatformCard = useMemo(
    () => visiblePlatformCards.find((card) => card.id === platform) ?? null,
    [platform, visiblePlatformCards],
  );
  const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;
  const uploadReady =
    Boolean(platform && file) &&
    !busy &&
    !entitlementState.loading &&
    entitlementState.canUpload &&
    entitlementState.canValidateUpload;
  const showWorkspaceLoadingGuard = workspaceReportState.isLoading;
  const showWorkspaceViewReport =
    !showWorkspaceLoadingGuard &&
    workspaceReportState.hasExistingReport &&
    Boolean(workspaceReportState.currentReportId);
  const showWorkspaceRunReportCta =
    !showWorkspaceLoadingGuard &&
    !showWorkspaceViewReport &&
    !reportAccessBlocked;
  const showWorkspaceRunReport =
    showWorkspaceRunReportCta && workspaceReportState.canRunReport;
  const showWorkspaceNeedsReportDrivingSource =
    !showWorkspaceLoadingGuard &&
    !showWorkspaceViewReport &&
    !workspaceReportState.canRunReport &&
    workspaceReportState.hasStagedSources;
  const workspaceCurrentReportHref = workspaceReportState.currentReportId
    ? buildReportDetailPathOrIndex(workspaceReportState.currentReportId)
    : "/app/report";
  const fileInputAccept = buildFileInputAccept(selectedPlatformCard);
  const supportsSelectedZipImport = selectedPlatformCard?.acceptedExtensions.includes(".zip") === true;
  const selectedSupportedZip = Boolean(file && supportsSelectedZipImport && isZipUploadCandidate(file));
  const unsupportedCsvWarning = Boolean(file && !file.name.toLowerCase().endsWith(".csv") && !selectedSupportedZip);
  const selectedWorkspaceSource = useMemo(
    () => workspaceReportState.includedSources.find((source) => source.platform === platform) ?? null,
    [platform, workspaceReportState.includedSources],
  );
  const workspaceBlockingReason = workspaceReportState.hasStagedSources
    ? "Add revenue + subscriber data before running a report."
    : "Add your first source to start.";

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    console.info("[upload.stepper.workspaceReportState]", {
      step,
      processingStatus,
      latestTerminalUploadStatus: latestTerminalUpload?.status ?? null,
      workspaceReportState,
      canRunReport: workspaceReportState.canRunReport,
      hasExistingReport: workspaceReportState.hasExistingReport,
    });
  }, [latestTerminalUpload?.status, processingStatus, step, workspaceReportState]);

  const stopPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, []);

  useEffect(() => {
    if (!preferredPlatform) {
      return;
    }

    stopPolling();
    setPlatform(preferredPlatform);
    setStep("platform");
    setFile(null);
    setUploadId(null);
    setStatusMsg(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);
    setBusy(false);
    setProcessingStatus(null);
    setHasResumeCandidate(false);
    setLatestTerminalUpload(null);
    setRunReportBusy(false);
    setRunReportError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [preferredPlatform, preferredPlatformNonce, stopPolling]);

  const logUploadDiagnostic = useCallback((event: string, details: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    console.info("[upload]", { event, ...details });
  }, []);

  const runReport = useCallback(async () => {
    if (runReportBusy) {
      return;
    }

    setRunReportBusy(true);
    setRunReportError(null);

    try {
      const result = await createReportRun();
      onReportCreated(result.reportId);
      router.push(buildReportDetailPathOrIndex(result.reportId));
    } catch (error) {
      setRunReportError(getReportErrorMessage(error));
    } finally {
      setRunReportBusy(false);
    }
  }, [onReportCreated, router, runReportBusy]);


  const setFailureState = useCallback(
    (params: {
      uploadId: string | null;
      rawStatus: string | null;
      reasonCode: string;
      message: string;
      updatedAt?: string | null;
      requestId?: string | null;
      operation?: string | null;
      nextStep?: Step;
    }) => {
      const resolvedMessage = friendlyFailureMessage(params.reasonCode);
      setStep(params.nextStep ?? "processing");
      setProcessingStatus("failed");
      setError(resolvedMessage);
      setReasonCode(params.reasonCode);
      setStatusMsg(resolvedMessage);
      setErrorRequestId(params.requestId ?? null);
      setErrorOperation(params.operation ?? null);
      setErrorDetails(
        buildUploadDiagnostics({
          uploadId: params.uploadId,
          rawStatus: params.rawStatus,
          reasonCode: params.reasonCode,
          message: params.message,
          updatedAt: params.updatedAt,
          requestId: params.requestId,
          operation: params.operation,
        }),
      );
      logUploadDiagnostic("terminal_failure", {
        uploadId: params.uploadId,
        reasonCode: params.reasonCode,
        requestId: params.requestId ?? null,
        operation: params.operation ?? null,
      });
    },
    [logUploadDiagnostic],
  );

  const updateProcessingFromEnvelope = useCallback(
    (envelope: UploadStatusEnvelope, fallbackUploadId?: string | null) => {
      const mapped = mapUploadStatus(envelope);
      const resolvedUploadId = mapped.uploadId ?? fallbackUploadId ?? uploadId;

      setProcessingStatus(mapped.status);
      setUploadId(resolvedUploadId ?? null);
      if (mapped.status === "processing") {
        setStatusMsg("Checking upload status...");
        setStep("processing");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "validated") {
        clearCurrentReport();
        setStatusMsg(mapped.message ?? "Upload validated. Keep staging sources, then run a combined report from the workspace.");
        setStep("done");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "ready") {
        clearCurrentReport();
        setStatusMsg(mapped.message ?? "This source is staged and ready for your next report.");
        setStep("done");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      setFailureState({
        uploadId: resolvedUploadId ?? null,
        rawStatus: mapped.rawStatus,
        reasonCode: mapped.reasonCode ?? "upload_failed",
        message: mapped.message ?? "Processing failed.",
        updatedAt: mapped.updatedAt,
      });
    },
    [clearCurrentReport, setFailureState, uploadId],
  );

  const resetFlow = useCallback(() => {
    stopPolling();
    setStep("platform");
    setPlatform(null);
    setFile(null);
    setUploadId(null);
    setStatusMsg(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);
    setBusy(false);
    setProcessingStatus(null);
    setHasResumeCandidate(false);
    setLatestTerminalUpload(null);
    setRunReportBusy(false);
    setRunReportError(null);
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [stopPolling]);

  const clearResumeCandidateState = useCallback(() => {
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    setHasResumeCandidate(false);
    setStatusMsg(null);
    setProcessingStatus(null);
    setUploadId(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setRunReportBusy(false);
    setRunReportError(null);
    setStep("platform");
  }, []);

  const copyDiagnostics = async () => {
    if (!errorDetails || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(errorDetails);
      setStatusMsg("Diagnostics copied");
    } catch {
      setStatusMsg("Unable to copy diagnostics");
    }
  };

  const pollUntilTerminal = useCallback(
    async (currentUploadId: string) => {
      stopPolling();
      const controller = new AbortController();
      pollAbortRef.current = controller;

      try {
        const terminalStatus = await pollUploadStatus({
          signal: controller.signal,
          getStatus: async () => mapUploadStatus(await getUploadStatus(currentUploadId)),
          onUpdate: (status) => {
            updateProcessingFromEnvelope(
              {
                upload_id: status.uploadId ?? currentUploadId,
                status: status.rawStatus ?? status.status,
                reason_code: status.reasonCode ?? undefined,
                message: status.message ?? undefined,
                updated_at: status.updatedAt ?? undefined,
              },
              currentUploadId,
            );
          },
        });
        if (terminalStatus.status === "ready" || terminalStatus.status === "validated" || terminalStatus.status === "failed") {
          await refreshWorkspaceDataSources();
        }
      } catch (pollError) {
        if (pollError instanceof UploadPollingCancelledError) {
          return;
        }

        if (pollError instanceof Error && /timed out/i.test(pollError.message)) {
          setFailureState({
            uploadId: currentUploadId,
            rawStatus: "processing",
            reasonCode: "timeout",
            message: "Upload is still processing. Retry status check in a moment.",
            operation: "uploads.status",
          });
          return;
        }

        const mapped = mapApiErrorToUploadFailure(pollError);
        setFailureState({
          uploadId: currentUploadId,
          rawStatus: null,
          reasonCode: mapped.reasonCode,
          message: mapped.message,
          requestId: mapped.requestId,
          operation: mapped.operation,
        });
        if (mapped.shouldStopPolling) {
          stopPolling();
        }
      } finally {
        if (pollAbortRef.current === controller) {
          pollAbortRef.current = null;
        }
      }
    },
    [refreshWorkspaceDataSources, setFailureState, stopPolling, updateProcessingFromEnvelope],
  );

  const resumeIfBackendActive = useCallback(
    async (statusEnvelope: UploadStatusEnvelope, fallbackUploadId: string): Promise<boolean> => {
      const mapped = mapUploadStatus(statusEnvelope);
      const activeUploadId = mapped.uploadId ?? fallbackUploadId;

      if (!activeUploadId) {
        return false;
      }

      // Only resume into the active upload stepper for genuinely in-progress uploads.
      // Terminal statuses (ready, validated, failed) must not hijack the upload page
      // as the default state on a fresh visit/login – the caller will call
      // clearResumeCandidateState() when this returns false.
      if (mapped.status !== "processing") {
        // Capture compact info for the optional non-blocking summary banner shown
        // in the platform step. Only surface for successful terminal states.
        if (mapped.status === "ready" || mapped.status === "validated") {
          clearCurrentReport();
          setLatestTerminalUpload({ status: mapped.status, uploadId: activeUploadId });
        }
        return false;
      }

      clearCurrentReport();
      setHasResumeCandidate(false);
      updateProcessingFromEnvelope(statusEnvelope, activeUploadId);
      await pollUntilTerminal(activeUploadId);
      return true;
    },
    [clearCurrentReport, pollUntilTerminal, updateProcessingFromEnvelope],
  );

  const runUpload = async () => {
    if (!platform || !file || busy || entitlementState.loading) {
      return;
    }

    if (!entitlementState.canUpload || !entitlementState.canValidateUpload) {
      setFailureState({
        uploadId,
        rawStatus: null,
        reasonCode: "entitlement_required",
        message: "Upload validation is unavailable for this account.",
        operation: "uploads.presign",
      });
      return;
    }

    clearCurrentReport();
    stopPolling();
    setBusy(true);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);
    setRunReportError(null);

    try {
      let uploadFile = file;
      if (isZipUploadCandidate(file)) {
        setStatusMsg("Inspecting ZIP archive…");
        const zipBuffer = await file.arrayBuffer();
        const zipInspection = inspectZipArchiveBuffer(zipBuffer, file);
        if (platform === "instagram" && zipInspection.kind === "supported_shape_instagram_candidate") {
          setStatusMsg("Preparing Instagram ZIP…");
          const instagramZipArtifact = await extractInstagramZipBufferToUploadArtifact(zipBuffer, {
            inspection: zipInspection,
            fileName: file.name,
          });

          if (!instagramZipArtifact.ok) {
            setFailureState({
              uploadId: null,
              rawStatus: null,
              reasonCode: instagramZipArtifact.reasonCode,
              message: instagramZipArtifact.message,
              operation: "uploads.instagram_zip_extract",
              nextStep: "file",
            });
            return;
          }

          uploadFile = new File([instagramZipArtifact.normalizedCsvText], instagramZipArtifact.normalizedFilename, {
            type: "text/csv",
            lastModified: file.lastModified,
          });
        } else if (platform === "tiktok" && zipInspection.kind === "supported_shape_tiktok_candidate") {
          setStatusMsg("Preparing TikTok ZIP…");
          const tiktokZipArtifact = await extractTiktokZipBufferToUploadArtifact(zipBuffer, {
            inspection: zipInspection,
            fileName: file.name,
          });

          if (!tiktokZipArtifact.ok) {
            setFailureState({
              uploadId: null,
              rawStatus: null,
              reasonCode: tiktokZipArtifact.reasonCode,
              message: tiktokZipArtifact.message,
              operation: "uploads.tiktok_zip_extract",
              nextStep: "file",
            });
            return;
          }

          uploadFile = new File([tiktokZipArtifact.normalizedCsvText], tiktokZipArtifact.normalizedFilename, {
            type: "text/csv",
            lastModified: file.lastModified,
          });
        } else if (platform === "youtube" && zipInspection.kind === "unsupported_archive") {
          // YouTube Takeout ZIP — passes through directly to the backend without client-side extraction.
          // The backend validates the YouTube Takeout archive shape.
          uploadFile = file;
        } else {
          const zipRejection =
            zipInspection.candidatePlatform && zipInspection.candidatePlatform !== platform
              ? {
                  reasonCode: "zip_not_importable",
                  message: "This ZIP format does not match the platform you selected. Check the platform and try again.",
                }
              : toZipUploadRejection(zipInspection) ?? {
            reasonCode: "unsupported_archive_shape",
            message: "This ZIP export isn't in one of the currently supported formats for this platform.",
          };

          setFailureState({
            uploadId: null,
            rawStatus: null,
            reasonCode: zipRejection.reasonCode,
            message: zipRejection.message,
            operation: "uploads.zip_intake",
            nextStep: "file",
          });
          return;
        }
      }

      setStep("uploading");
      setStatusMsg("Preparing file…");
      // Compute checksum and detect export type concurrently to save time.
      const [checksum, clientContext] = await Promise.all([
        computeSHA256Hex(uploadFile),
        platform === "patreon"
          ? buildPatreonClientContext(uploadFile)
          : platform === "instagram"
            ? buildInstagramClientContext(uploadFile)
            : Promise.resolve(undefined),
      ]);
      console.debug("Presign checksum computed", {
        fileName: uploadFile.name,
        size: uploadFile.size,
        hasChecksum: true,
        ...(clientContext ? { detectedExportType: JSON.parse(clientContext).detected_export_type } : {}),
      });

      setStatusMsg("Requesting secure upload URL…");
      const presign = await createUploadPresign({
        platform,
        filename: uploadFile.name,
        content_type: uploadFile.type || "text/csv",
        size: uploadFile.size,
        checksum,
        ...(clientContext ? { client_context: clientContext } : {}),
      });

      setUploadId(presign.upload_id);
      if (typeof window !== "undefined") {
        writeUploadResume(window.localStorage, presign.upload_id);
      }

      if (typeof presign.callback_proof === "undefined") {
        throw new Error("Upload finalize failed: missing callback proof from presign response");
      }

      try {
        setStatusMsg("Uploading file…");
        await uploadFileToPresignedUrl({
          presignedUrl: presign.presigned_url,
          file: uploadFile,
          headers: presign.headers,
        });
      } catch (storageUploadError) {
        await finalizeUploadCallback(
          {
            upload_id: presign.upload_id,
            success: false,
            size_bytes: uploadFile.size,
            callback_proof: presign.callback_proof,
            platform,
            object_key: presign.object_key,
            filename: uploadFile.name,
            content_type: uploadFile.type || "text/csv",
          },
          presign.callback_url,
        );
        throw storageUploadError;
      }

      setStatusMsg("Finalizing upload…");
      const callback = await finalizeUploadCallback(
        {
          upload_id: presign.upload_id,
          success: true,
          size_bytes: uploadFile.size,
          callback_proof: presign.callback_proof,
          platform,
          object_key: presign.object_key,
          filename: uploadFile.name,
          content_type: uploadFile.type || "text/csv",
        },
        presign.callback_url,
      );

      if (callback.warnings?.length) {
        setWarnings(callback.warnings);
      }

      const callbackStatus = mapUploadStatus({
        upload_id: presign.upload_id,
        status: callback.status,
      });
      if (callbackStatus.status !== "processing") {
        updateProcessingFromEnvelope(
          {
            upload_id: presign.upload_id,
            status: callback.status,
          },
          presign.upload_id,
        );
        await refreshWorkspaceDataSources();
        return;
      }

      setStep("processing");
      setStatusMsg("Checking upload status...");
      await pollUntilTerminal(presign.upload_id);
    } catch (uploadError) {
      const mapped = mapApiErrorToUploadFailure(uploadError);
      setFailureState({
        uploadId,
        rawStatus: null,
        reasonCode: mapped.reasonCode,
        message: mapped.message,
        requestId: mapped.requestId,
        operation: mapped.operation,
      });
    } finally {
      setBusy(false);
    }
  };

  const retryProcessing = async () => {
    if (!uploadId || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setReasonCode(null);
    setStatusMsg("Retrying status check…");

    try {
      await pollUntilTerminal(uploadId);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    const resumeRecord = typeof window !== "undefined" ? readUploadResume(window.localStorage) : null;
    const resumeUploadId = resumeRecord?.uploadId ?? null;
    setHasResumeCandidate(Boolean(resumeUploadId));
    if (!resumeUploadId || step !== "platform" || uploadId) {
      return;
    }

    let active = true;

    const hydrateStatus = async () => {
      try {
        const byIdResult = await awaitWithTimeout(getUploadStatus(resumeUploadId), RESUME_STATUS_TIMEOUT_MS);
        if (!active) {
          return;
        }

        if (!byIdResult.timedOut && byIdResult.value) {
          const resumedFromById = await resumeIfBackendActive(byIdResult.value, resumeUploadId);
          if (!active || resumedFromById) {
            return;
          }

          clearResumeCandidateState();
          return;
        }
      } catch (resumeError) {
        if (!active) {
          return;
        }

        const mapped = mapApiErrorToUploadFailure(resumeError);
        if (mapped.reasonCode !== "upload_not_found") {
          clearResumeCandidateState();
          return;
        }
      }

      try {
        const latestResult = await awaitWithTimeout(getLatestUploadStatus(), RESUME_STATUS_TIMEOUT_MS);
        if (!active) {
          return;
        }

        if (!latestResult.timedOut && latestResult.value) {
          const latestMapped = mapUploadStatus(latestResult.value);
          const resumedFromLatest = await resumeIfBackendActive(latestResult.value, latestMapped.uploadId ?? resumeUploadId);
          if (!active || resumedFromLatest) {
            return;
          }
        }
      } catch {
        // Fall back to idle state if reconciliation cannot confirm an active upload.
      }

      if (active) {
        clearResumeCandidateState();
      }
    };

    void hydrateStatus();

    return () => {
      active = false;
    };
  }, [clearResumeCandidateState, resumeIfBackendActive, step, uploadId]);

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-white/8 bg-[#081325]/95 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.95)] backdrop-blur md:p-6">
      <UploadFlowHeader />
      <Stepper steps={steps} activeIndex={activeStepIndex} />
      <UploadPrivacyLine />

      {error ? (
        <ErrorBanner data-testid="upload-terminal-error"
          title="Upload needs attention"
          message={error}
          requestId={errorRequestId ?? undefined}
          retryLabel="Retry status"
          onRetry={uploadId && !busy ? () => void retryProcessing() : undefined}
          action={
            <>
              <button
                type="button"
                data-testid="upload-reset"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={resetFlow}
              >
                Reset
              </button>
              <button
                type="button"
                data-testid="upload-copy-diagnostics"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={copyDiagnostics}
                disabled={!errorDetails}
              >
                Copy diagnostics
              </button>
            </>
          }
        >
          <div className="space-y-2">
            {reasonCode ? <p className="text-xs text-red-100/80">Reason code: {reasonCode}</p> : null}
            {errorOperation ? <p className="text-xs text-red-100/80">Operation: {errorOperation}</p> : null}
            {reasonCode === "session_expired" ? (
              <Link href="/login" className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Log in again
              </Link>
            ) : null}
            {reasonCode === "entitlement_required" ? (
              <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Go to Billing
              </Link>
            ) : null}
          </div>
        </ErrorBanner>
      ) : null}

      {warnings.length > 0 ? (
        <InlineAlert variant="warn" title="Limited data quality detected">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      {entitlementState.loading ? (
        <InlineAlert variant="info" title="Checking plan access" data-testid="upload-entitlement-loading">
          Validating your entitlement before report generation is enabled.
        </InlineAlert>
      ) : null}

      {reportAccessBlocked ? (
        <InlineAlert variant="warn" title="Upgrade required for report generation" data-testid="upload-entitlement-required">
          <p className="mb-2 text-sm text-amber-100/90">
            Free includes upload validation only. Upgrade to Report or Pro to generate a paid report.
            {entitlementState.accessReasonCode ? ` (${entitlementState.accessReasonCode})` : ""}
          </p>
          <Link href="/app/billing" className="inline-flex rounded-lg border border-amber-200/60 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-300/10">
            Go to Billing
          </Link>
        </InlineAlert>
      ) : null}

      {step === "platform" ? (
        <div className="space-y-5">
          {uploadId ? null : hasResumeCandidate ? (
            <InlineAlert variant="info" title="Found an in-progress upload" data-testid="upload-resume-banner">
              We found a recent upload and will automatically check its status.
            </InlineAlert>
          ) : latestTerminalUpload ? (
            <InlineAlert
              variant={latestTerminalUpload.status === "ready" ? "success" : "info"}
              title={
                latestTerminalUpload.status === "ready"
                  ? "Latest upload is staged"
                  : "Latest upload validated"
              }
              data-testid="upload-completed-summary"
            >
              <p className="text-xs text-current/80">
                {buildUploadRecognitionMessage(selectedWorkspaceSource, selectedPlatformCard)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {showWorkspaceLoadingGuard ? (
                  <span className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-300" data-testid="upload-completed-workspace-loading">
                    Checking workspace...
                  </span>
                ) : showWorkspaceViewReport ? (
                  <Link
                    href={workspaceCurrentReportHref}
                    data-testid="upload-completed-view-report"
                    className="rounded-lg border border-emerald-200/60 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-300/10"
                  >
                    View Report
                  </Link>
                ) : showWorkspaceRunReportCta ? (
                  <button
                    type="button"
                    data-testid="upload-completed-run-report"
                    onClick={() => void runReport()}
                    disabled={runReportBusy || !workspaceReportState.canRunReport}
                    className="rounded-lg border border-emerald-200/60 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runReportBusy ? "Running..." : "Run Report"}
                  </button>
                ) : latestTerminalUpload.status === "validated" || reportAccessBlocked ? (
                  <Link
                    href="/app/billing"
                    className="rounded-lg border border-blue-200/60 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10"
                  >
                    Unlock report
                  </Link>
                ) : null}
                <button
                  type="button"
                  data-testid="upload-completed-dismiss"
                  onClick={() => {
                    setRunReportError(null);
                    setLatestTerminalUpload(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
                >
                  Add another source
                </button>
              </div>
              {showWorkspaceRunReport && runReportError ? (
                <p className="mt-2 text-xs text-rose-200" data-testid="upload-completed-run-report-error">
                  {runReportError}
                </p>
              ) : null}
              {showWorkspaceNeedsReportDrivingSource ? (
                <p className="mt-2 text-xs text-current/75">
                  {workspaceBlockingReason}
                </p>
              ) : null}
            </InlineAlert>
          ) : null}
          <UploadPlatformPicker
            platformSections={platformSections}
            showPlatformSectionHeading={showPlatformSectionHeading || sourceManifest.platforms.length === 0}
            platform={platform}
            onSelect={setPlatform}
          />

          <UploadPrimaryFooterBar
            canContinue={Boolean(platform)}
            onContinue={() => {
              setStep("file");
              setError(null);
              setErrorDetails(null);
              setErrorRequestId(null);
              setErrorOperation(null);
            }}
            onStartOver={resetFlow}
          />
        </div>
      ) : null}

      {step === "file" ? (
        <div className="space-y-5">
          <StepHeader
            title="Select file"
            subtitle={
              selectedPlatformCard ? `Upload a supported ${selectedPlatformCard.label} file.` : "Upload a supported file for this platform."
            }
          />
          <div
            className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-slate-400"
            data-testid="upload-file-guide"
          >
            <p className="text-slate-200">
              {selectedPlatformCard
                ? `${selectedPlatformCard.label} selected. Accepted format: ${selectedPlatformCard.acceptedFileTypesLabel ?? "Supported file required"}.`
                : "Upload a supported file for this platform."}
            </p>
            <p className="mt-2">Exact file rules, ZIP requirements, and troubleshooting live in the Upload Guide.</p>
            <Link href="/app/help#upload-guide" className="mt-3 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
              Open upload guide
            </Link>
          </div>
          <button
            type="button"
            className="w-full rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-5 py-8 text-center transition hover:border-blue-400/40 hover:bg-white/[0.03]"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-white">Click to choose a file</p>
            <p className="mt-1 text-xs text-slate-400">Drag and drop is supported by your browser as well.</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={fileInputAccept}
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
            }}
          />

          {file ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-slate-300">
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-400">Size: {readableFileSize(file.size)}</p>
              <p className="text-xs text-slate-400">Last modified: {new Date(file.lastModified).toLocaleString()}</p>
            </div>
          ) : null}

          {unsupportedCsvWarning ? (
            <InlineAlert variant="warn" title="This file may not be CSV">
              We recommend uploading a .csv file. Non-CSV files may be rejected during bounded preflight before upload.
            </InlineAlert>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Exact file rules are in Upload Guide.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!uploadReady}
                onClick={runUpload}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  uploadReady
                    ? "border-emerald-300/70 bg-brand-blue shadow-[0_0_0_3px_rgba(16,185,129,0.18)] hover:bg-brand-blue/90 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.22)]"
                    : "border-transparent bg-brand-blue hover:bg-brand-blue/90"
                }`}
              >
                {entitlementState.loading ? "Checking access..." : "Upload & Validate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "uploading" || step === "processing" ? (
        <div className="space-y-4">
          <StepHeader
            title={step === "uploading" ? "Uploading file" : "Processing upload"}
            subtitle={
              step === "uploading"
                ? "We're sending your file securely."
                : processingStatus === "failed"
                  ? "Processing did not finish successfully."
                  : "Most uploads complete within 45-90 seconds. Keep this tab open while we validate your data."
            }
          />
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
            {(step === "uploading" || busy) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            )}
            <p className="text-sm text-slate-300">{statusMsg ?? "Working..."}</p>
          </div>
          <div className="flex gap-2">
            {error ? (
              <button
                type="button"
                data-testid="upload-retry"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.05]"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-5">
          {processingStatus === "validated" ? (
            <>
              <InlineAlert variant="info" title={`${selectedPlatformCard?.label ?? "Source"} staged`} data-testid="upload-terminal-validated">
                {buildUploadRecognitionMessage(selectedWorkspaceSource, selectedPlatformCard)}
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                {showWorkspaceLoadingGuard ? (
                  <span className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400" data-testid="upload-workspace-loading">
                    Checking workspace...
                  </span>
                ) : showWorkspaceViewReport ? (
                  <Link href={workspaceCurrentReportHref} data-testid="upload-view-report" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                    View Report
                  </Link>
                ) : showWorkspaceRunReportCta ? (
                  <button
                    type="button"
                    data-testid="upload-run-report"
                    onClick={() => void runReport()}
                    disabled={runReportBusy || !workspaceReportState.canRunReport}
                    className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runReportBusy ? "Running..." : "Run Report"}
                  </button>
                ) : reportAccessBlocked ? (
                  <Link href="/app/billing" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                    Unlock report
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Add another source
                </button>
              </div>
              {showWorkspaceRunReport && runReportError ? (
                <p className="text-xs text-rose-600" data-testid="upload-run-report-error">
                  {runReportError}
                </p>
              ) : null}
              {showWorkspaceNeedsReportDrivingSource ? (
                <p className="text-xs text-slate-500">
                  {workspaceBlockingReason}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <InlineAlert variant="success" title={`${selectedPlatformCard?.label ?? "Source"} added successfully`} data-testid="upload-terminal-success">
                <p>{buildUploadRecognitionMessage(selectedWorkspaceSource, selectedPlatformCard)}</p>
                <p className="mt-1 text-current/75">
                  Add more sources to enrich your report, or use the workspace action below.
                </p>
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                {showWorkspaceLoadingGuard ? (
                  <span className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400" data-testid="upload-workspace-loading">
                    Checking workspace...
                  </span>
                ) : showWorkspaceViewReport ? (
                  <Link href={workspaceCurrentReportHref} data-testid="upload-view-report" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                    View Report
                  </Link>
                ) : showWorkspaceRunReportCta ? (
                  <button
                    type="button"
                    data-testid="upload-run-report"
                    onClick={() => void runReport()}
                    disabled={runReportBusy || !workspaceReportState.canRunReport}
                    className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runReportBusy ? "Running..." : "Run Report"}
                  </button>
                ) : reportAccessBlocked ? (
                  <Link href="/app/billing" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                    Unlock report
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Add another source
                </button>
              </div>
              {showWorkspaceRunReport && runReportError ? (
                <p className="text-xs text-rose-600" data-testid="upload-run-report-error">
                  {runReportError}
                </p>
              ) : null}
              {showWorkspaceNeedsReportDrivingSource ? (
                <p className="text-xs text-slate-500">
                  {workspaceBlockingReason}
                </p>
              ) : null}
            </>
          )}
          <p className="text-xs text-slate-500">Upload ID: {uploadId ?? "n/a"}</p>
        </div>
      ) : null}

      {step !== "done" && step !== "uploading" && step !== "processing" ? (
        <div className="flex justify-end">
          <div className="flex gap-2">
            {error ? (
              <button
                type="button"
                data-testid="upload-retry"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.05]"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

