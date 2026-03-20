"use client";

import Link from "next/link";
import Image from "next/image";
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
  COMING_SOON_CHIP_PLATFORMS,
  groupPlatformCards,
  type UploadPlatformCardMetadata,
} from "@/src/lib/upload/platform-metadata";
import { getSupportedRevenueUploadFormatGuidanceFromCards } from "@/src/lib/upload/support-surface";
import { detectPatreonExportType } from "@/src/lib/upload/patreon-csv-detector";
import { detectInstagramExportType } from "@/src/lib/upload/instagram-csv-detector";
import { inspectZipUploadFile, isZipUploadCandidate, toZipUploadRejection } from "@/src/lib/upload/zip-intake";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import { useEntitlementState } from "../../../_components/use-entitlement-state";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import UploadCard from "./UploadCard";
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

const friendlyFailureMessage = (reasonCode: string | null, context?: { platform?: UploadPlatform | null }) => {
  if (
    reasonCode === "zip_not_importable" ||
    reasonCode === "candidate_zip_not_yet_supported" ||
    reasonCode === "unsupported_archive_shape" ||
    reasonCode === "ambiguous_archive_shape"
  ) {
    return "This ZIP format is not yet importable. Upload a supported CSV instead.";
  }

  if (
    reasonCode === "not_zip" ||
    reasonCode === "corrupt_archive" ||
    reasonCode === "encrypted_or_unreadable_archive"
  ) {
    return "We couldn’t read that ZIP file. Upload a supported CSV instead.";
  }

  if (reasonCode === "unsafe_archive_path" || reasonCode === "too_many_entries" || reasonCode === "archive_too_large") {
    return "This ZIP file can’t be imported. Upload a supported CSV instead.";
  }

  switch (reasonCode) {
    case "validation_failed":
      if (context?.platform === "patreon") {
        return (
          "We couldn’t validate that Patreon CSV. Make sure you’re uploading the native Members export " +
          "(Patreon › Audience › Members › Export CSV), which includes columns like Patron Status, " +
          "Pledge Amount, and Patronage Since Date."
        );
      }
      if (context?.platform === "instagram") {
        return (
          "We couldn’t validate that Instagram CSV. Please upload a normalized Instagram performance CSV " +
          "in the supported format and try again."
        );
      }
      if (context?.platform === "tiktok") {
        return (
          "We couldn’t validate that TikTok CSV. Please upload a normalized TikTok performance CSV " +
          "in the supported format and try again."
        );
      }
      return "We couldn’t validate that CSV. Please upload the supported CSV format and try again.";
    case "schema_mismatch_or_missing_columns":
      if (context?.platform === "patreon") {
        return (
          "The CSV columns don’t match the expected Patreon Members export format. " +
          "Please use the native Members CSV export from Patreon › Audience › Members › Export CSV. " +
          "This file should include columns like Patron Status, Pledge Amount, and Patronage Since Date."
        );
      }
      if (context?.platform === "instagram") {
        return (
          "The CSV columns don’t match the supported Instagram performance format. " +
          "Please upload a normalized Instagram performance CSV."
        );
      }
      if (context?.platform === "tiktok") {
        return (
          "The CSV columns don’t match the supported TikTok performance format. " +
          "Please upload a normalized TikTok performance CSV."
        );
      }
      return (
        "The CSV columns don’t match the supported format for this platform. " +
        "Please upload the supported CSV format and try again."
      );
    case "recognized_not_implemented":
      if (context?.platform === "instagram") {
        return "We recognised your Instagram file, but this upload path supports normalized Instagram performance CSVs only.";
      }
      if (context?.platform === "tiktok") {
        return "We recognised your TikTok file, but this upload path supports normalized TikTok performance CSVs only.";
      }
      return "We recognised your file but full support for this export type is coming soon.";
    case "candidate_zip_not_yet_supported":
      return "This ZIP format is not yet importable. Upload a supported CSV instead.";
    case "not_zip":
      return "We couldn’t read that ZIP file. Upload a supported CSV instead.";
    case "corrupt_archive":
      return "We couldn’t read that ZIP archive. Use a valid ZIP file or continue with a supported CSV upload.";
    case "encrypted_or_unreadable_archive":
      return "Encrypted or unreadable ZIP archives are rejected by the bounded ZIP intake layer.";
    case "unsafe_archive_path":
      return "This ZIP archive contains unsafe paths and was rejected before upload.";
    case "unsupported_archive_shape":
      return "This ZIP archive does not match a bounded allowlisted import shape.";
    case "too_many_entries":
      return "This ZIP archive exceeds the bounded entry-count limit and was rejected.";
    case "archive_too_large":
      return "This ZIP archive exceeds the bounded size limit and was rejected.";
    case "ambiguous_archive_shape":
      return "This ZIP archive matches multiple bounded shapes, so it was rejected as ambiguous.";
    case "ingest_failed":
      return "We couldn’t ingest the file right now. Please retry in a moment.";
    case "report_failed":
      return "The upload succeeded, but report generation failed. Please retry.";
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

// Extremely subtle brand-tinted dark chips — 9% opacity tint on both light and dark card surfaces.
// On unselected (white) cards the tint reads as a soft warm/cool cast; on selected (dark navy) cards
// the same value blends into the deep background. Both states benefit without being sticker-like.
const PLATFORM_LOGO_BUBBLE: Record<string, { bg: string; ring: string }> = {
  patreon:   { bg: "bg-[rgba(248,67,20,0.09)]",  ring: "ring-[rgba(248,67,20,0.18)]" },
  substack:  { bg: "bg-[rgba(255,104,31,0.09)]", ring: "ring-[rgba(255,104,31,0.18)]" },
  youtube:   { bg: "bg-[rgba(255,0,0,0.08)]",    ring: "ring-[rgba(255,0,0,0.16)]" },
  instagram: { bg: "bg-[rgba(193,53,132,0.09)]", ring: "ring-[rgba(193,53,132,0.18)]" },
  tiktok:    { bg: "bg-[rgba(37,244,238,0.10)]", ring: "ring-[rgba(37,244,238,0.18)]" },
};

type PlatformCardProps = {
  label: string;
  subtitle: string;
  icon: string;
  available: boolean;
  selected: boolean;
  onClick: () => void;
  testId?: string;
  platformId?: string;
};

function PlatformCard({ label, subtitle, icon, available, selected, onClick, testId, platformId }: PlatformCardProps) {
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
        "group relative flex h-full w-full flex-col rounded-2xl border p-3 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        available
          ? selected
            ? "cursor-pointer border-blue-400/60 bg-[#0b1628] shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_0_20px_-6px_rgba(59,130,246,0.28)]"
            : "cursor-pointer border-slate-200 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-blue-300/60 hover:shadow-[0_8px_20px_-8px_rgba(37,99,235,0.16)]"
          : "cursor-not-allowed border-slate-200 bg-white opacity-55",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300 ring-1 ring-inset ring-blue-400/25">
          <span className="h-1 w-1 rounded-full bg-blue-400" />
          Selected
        </span>
      ) : null}
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bubbleClass}`}>
        <Image
          src={icon}
          alt={`${label} logo`}
          width={20}
          height={20}
          className="platform-icon block h-5 w-5 object-contain"
        />
      </span>
      <p className={`mt-2 text-sm font-semibold ${selected ? "text-white" : "text-slate-900"}`}>{label}</p>
      <p className={`mt-0.5 text-xs leading-snug ${selected ? "text-slate-300/80" : "text-slate-500"}`}>{subtitle}</p>
      <span className="mt-auto flex items-center gap-1.5 pt-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${available ? "bg-emerald-400" : "bg-slate-300"}`} />
        <span className={`text-[9px] font-medium uppercase tracking-[0.1em] ${available ? (selected ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"}`}>
          {available ? "Supported" : "Coming soon"}
        </span>
      </span>
    </button>
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
  visiblePlatformCards: UploadPlatformCardMetadata[];
  supportedRevenueUploads: string;
};

export default function UploadStepper({ visiblePlatformCards, supportedRevenueUploads }: UploadStepperProps) {
  const entitlementState = useEntitlementState();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<UploadPlatform | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
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
    reportId: string | null;
  } | null>(null);

  const activeStepIndex = stepOrder.indexOf(step);
  const progressPct = Math.round(((activeStepIndex + 1) / stepOrder.length) * 100);
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
  const selectedPlatformCard = useMemo(
    () => visiblePlatformCards.find((card) => card.id === platform) ?? null,
    [platform, visiblePlatformCards],
  );
  const supportedRevenueUploadFormats = useMemo(
    () => getSupportedRevenueUploadFormatGuidanceFromCards(visiblePlatformCards),
    [visiblePlatformCards],
  );
  const uploadReady =
    Boolean(platform && file) &&
    !busy &&
    !entitlementState.loading &&
    entitlementState.canUpload &&
    entitlementState.canValidateUpload;
  const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;

  const unsupportedCsvWarning = file && !file.name.toLowerCase().endsWith(".csv");

  const stopPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, []);

  const logUploadDiagnostic = useCallback((event: string, details: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    console.info("[upload]", { event, ...details });
  }, []);


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
      setStep(params.nextStep ?? "processing");
      setProcessingStatus("failed");
      setError(friendlyFailureMessage(params.reasonCode, { platform }));
      setReasonCode(params.reasonCode);
      setStatusMsg(params.message);
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
    [logUploadDiagnostic, platform],
  );

  const updateProcessingFromEnvelope = useCallback(
    (envelope: UploadStatusEnvelope, fallbackUploadId?: string | null) => {
      const mapped = mapUploadStatus(envelope);
      const resolvedUploadId = mapped.uploadId ?? fallbackUploadId ?? uploadId;

      setProcessingStatus(mapped.status);
      setUploadId(resolvedUploadId ?? null);
      if (mapped.reportId) {
        setReportId(mapped.reportId);
      }

      if (mapped.status === "processing") {
        setStatusMsg("Processing upload…");
        setStep("processing");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "validated") {
        setStatusMsg(mapped.message ?? "Upload validated. Upgrade to Report or Pro to generate a paid report.");
        setStep("done");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "ready") {
        setStatusMsg("Report ready");
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
    [setFailureState, uploadId],
  );

  const resetFlow = useCallback(() => {
    stopPolling();
    setStep("platform");
    setPlatform(null);
    setFile(null);
    setUploadId(null);
    setReportId(null);
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
    setReportId(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
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
        await pollUploadStatus({
          signal: controller.signal,
          getStatus: async () => mapUploadStatus(await getUploadStatus(currentUploadId)),
          onUpdate: (status) => {
            updateProcessingFromEnvelope(
              {
                upload_id: status.uploadId ?? currentUploadId,
                status: status.rawStatus ?? status.status,
                reason_code: status.reasonCode ?? undefined,
                message: status.message ?? undefined,
                report_id: status.reportId ?? undefined,
                updated_at: status.updatedAt ?? undefined,
              },
              currentUploadId,
            );
          },
        });
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
    [setFailureState, stopPolling, updateProcessingFromEnvelope],
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
          setLatestTerminalUpload({ status: mapped.status, uploadId: activeUploadId, reportId: mapped.reportId });
        }
        return false;
      }

      setHasResumeCandidate(false);
      updateProcessingFromEnvelope(statusEnvelope, activeUploadId);
      await pollUntilTerminal(activeUploadId);
      return true;
    },
    [pollUntilTerminal, updateProcessingFromEnvelope],
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

    stopPolling();
    setBusy(true);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);

    try {
      if (isZipUploadCandidate(file)) {
        setStatusMsg("Inspecting ZIP archive…");
        const zipInspection = await inspectZipUploadFile(file);
        const zipRejection = toZipUploadRejection(zipInspection) ?? {
          reasonCode: "unsupported_archive_shape",
          message: "ZIP archive could not be accepted by the bounded intake layer.",
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

      setStep("uploading");
      setStatusMsg("Preparing file…");
      // Compute checksum and detect export type concurrently to save time.
      const [checksum, clientContext] = await Promise.all([
        computeSHA256Hex(file),
        platform === "patreon"
          ? buildPatreonClientContext(file)
          : platform === "instagram"
            ? buildInstagramClientContext(file)
            : Promise.resolve(undefined),
      ]);
      console.debug("Presign checksum computed", {
        fileName: file.name,
        size: file.size,
        hasChecksum: true,
        ...(clientContext ? { detectedExportType: JSON.parse(clientContext).detected_export_type } : {}),
      });

      setStatusMsg("Requesting secure upload URL…");
      const presign = await createUploadPresign({
        platform,
        filename: file.name,
        content_type: file.type || "text/csv",
        size: file.size,
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
          file,
          headers: presign.headers,
        });
      } catch (storageUploadError) {
        await finalizeUploadCallback(
          {
            upload_id: presign.upload_id,
            success: false,
            size_bytes: file.size,
            callback_proof: presign.callback_proof,
            platform,
            object_key: presign.object_key,
            filename: file.name,
            content_type: file.type || "text/csv",
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
          size_bytes: file.size,
          callback_proof: presign.callback_proof,
          platform,
          object_key: presign.object_key,
          filename: file.name,
          content_type: file.type || "text/csv",
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
        return;
      }

      setStep("processing");
      setStatusMsg("Processing upload…");
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
    <UploadCard className="space-y-6">
      <Stepper steps={steps} activeIndex={activeStepIndex} />

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

      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Step {activeStepIndex + 1} of {stepOrder.length}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

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
              title={latestTerminalUpload.status === "ready" ? "Latest upload is ready" : "Latest upload validated"}
              data-testid="upload-completed-summary"
            >
              <p className="text-xs text-current/80">
                {latestTerminalUpload.status === "ready"
                  ? "Report ready."
                  : "Upload validated. Report generation may continue based on your plan."}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {latestTerminalUpload.status === "ready" ? (
                  <Link
                    href={buildReportDetailPathOrIndex(latestTerminalUpload.reportId)}
                    data-testid="upload-completed-view-report"
                    className="rounded-lg border border-emerald-200/60 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-300/10"
                  >
                    View report
                  </Link>
                ) : (
                  <Link
                    href="/app/billing"
                    className="rounded-lg border border-blue-200/60 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10"
                  >
                    Unlock report
                  </Link>
                )}
                <button
                  type="button"
                  data-testid="upload-completed-dismiss"
                  onClick={() => setLatestTerminalUpload(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
                >
                  Upload another
                </button>
              </div>
            </InlineAlert>
          ) : null}
          <StepHeader title="Choose platform" subtitle="Select the data source for this upload." />
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-3 py-2" data-testid="upload-platform-guide">
            <p className="text-xs font-semibold text-blue-100">Start with a supported CSV</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-blue-100/70">Upload accepts {supportedRevenueUploads}. Choose the platform that matches your supported file, then continue with a fresh CSV.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-blue-100/70">{supportedRevenueUploadFormats}</p>
            <Link href="/app/help#upload-guide" className="mt-1.5 inline-flex text-[10px] font-medium text-blue-300/75 hover:text-blue-200">
              Open upload guide →
            </Link>
          </div>
          <div className="space-y-4">
            {platformSections.map((section) => (
              <section key={section.category} className="space-y-2" data-testid={`platform-section-${section.category}`}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{section.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => {
                    const selected = platform === item.id;
                    return (
                      <PlatformCard
                        key={item.id}
                        label={item.label}
                        subtitle={item.subtitle}
                        icon={item.icon}
                        available={item.available}
                        selected={selected}
                        onClick={() => {
                          if (!item.available) return;
                          setPlatform(item.id);
                        }}
                        testId={`platform-card-${item.id}`}
                        platformId={item.id}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
            <div className="space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">Coming soon</p>
              <div className="flex flex-wrap gap-1.5" aria-label="Platforms coming soon">
                {COMING_SOON_CHIP_PLATFORMS.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] py-0.5 pl-1 pr-2 text-[10px] font-medium text-slate-500"
                    aria-disabled="true"
                  >
                    {item.icon ? (
                      <Image
                        src={item.icon}
                        alt={`${item.label} logo`}
                        width={13}
                        height={13}
                        className="block h-3 w-3 object-contain opacity-35"
                      />
                    ) : (
                      <span className="flex h-3 w-3 items-center justify-center rounded-full bg-white/10 text-[8px] font-bold text-slate-500">
                        {item.label[0]}
                      </span>
                    )}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!platform}
              onClick={() => {
                setStep("file");
                setError(null);
                setErrorDetails(null);
                setErrorRequestId(null);
                setErrorOperation(null);
              }}
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === "file" ? (
        <div className="space-y-5">
          <StepHeader
            title="Select file"
            subtitle={
              selectedPlatformCard?.importMode === "normalized_csv"
                ? "Upload the supported normalized CSV for this platform."
                : "Upload the supported CSV for this platform."
            }
          />
          <InlineAlert variant="info" title="What happens after upload" data-testid="upload-file-guide">
            <p>Accepted file type: CSV. EarnSigma validates the file first, then keeps processing until a report is ready when your plan includes report generation.</p>
            <p className="mt-2">If validation fails, retry with the supported CSV format for this platform. If processing stalls, retry status before starting over.</p>
            {selectedPlatformCard?.guidance ? <p className="mt-2">{selectedPlatformCard.guidance}</p> : null}
            <Link href="/app/help#after-upload" className="mt-3 inline-flex rounded-lg border border-blue-200/60 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10">
              Review upload help
            </Link>
          </InlineAlert>
          <button
            type="button"
            className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center hover:border-brand-blue/60 hover:bg-slate-100"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-slate-900">Click to choose a file</p>
            <p className="mt-1 text-xs text-slate-600">Drag and drop is supported by your browser as well.</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
            }}
          />

          {file ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-600">Size: {readableFileSize(file.size)}</p>
              <p className="text-xs text-slate-600">Last modified: {new Date(file.lastModified).toLocaleString()}</p>
            </div>
          ) : null}

          {unsupportedCsvWarning ? (
            <InlineAlert variant="warn" title="This file may not be CSV">
              We recommend uploading a .csv file. Non-CSV files may be rejected during bounded preflight before upload.
            </InlineAlert>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Need help? Review the upload guide for the supported format.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
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
                ? "We’re sending your file securely."
                : processingStatus === "failed"
                  ? "Processing did not finish successfully."
                  : "Most uploads complete within 45–90 seconds. Keep this tab open while we validate your data."
            }
          />
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            {(step === "uploading" || busy) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
            )}
            <p className="text-sm text-slate-700">{statusMsg ?? "Working…"}</p>
          </div>
          <div className="flex gap-2">
            {error ? (
              <button
                type="button"
                data-testid="upload-retry"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
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
              <InlineAlert variant="info" title="Upload validated" data-testid="upload-terminal-validated">
                Your file passed validation. Upgrade to Report or Pro to generate a paid report from this upload.
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                <Link href="/app/billing" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                  Unlock report
                </Link>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Upload another
                </button>
              </div>
            </>
          ) : (
            <>
              <InlineAlert variant="success" title="Report ready" data-testid="upload-terminal-success">
                Your upload was validated and your report is now available.
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildReportDetailPathOrIndex(reportId)}
                  data-testid="upload-view-report"
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
                >
                  View report
                </Link>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Upload another
                </button>
              </div>
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
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </UploadCard>
  );
}

