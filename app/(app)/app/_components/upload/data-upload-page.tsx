"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getUploadStatus, type UploadStatusResponse } from "@/src/lib/api/upload";
import { mapApiErrorToUploadFailure } from "@/src/lib/upload/errors";
import { clearUploadResume, readUploadResume } from "@/src/lib/upload/resume";
import { mapUploadStatus } from "@/src/lib/upload/status";
import UploadCard from "./UploadCard";
import UploadStepper, { type ResumeLookupState } from "./upload-stepper";

function getPlatformLabel(status: UploadStatusResponse): string {
  const platform = (status as UploadStatusResponse & { platform?: string; source?: string }).platform
    ?? (status as UploadStatusResponse & { platform?: string; source?: string }).source;
  return typeof platform === "string" && platform.trim().length > 0 ? platform : "Unknown";
}

function formatLastUpdated(status: UploadStatusResponse): string {
  const timestamp = status.updated_at ?? status.updatedAt ?? status.ready_at ?? status.readyAt ?? status.created_at ?? status.createdAt;
  if (!timestamp) {
    return "Unknown";
  }

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleString();
}

export default function DataUploadPage() {
  const [resumeLookup, setResumeLookup] = useState<ResumeLookupState>({ kind: "idle" });

  const runResumeLookup = useCallback(async () => {
    const resumeRecord = typeof window !== "undefined" ? readUploadResume(window.localStorage) : null;
    const resumeUploadId = resumeRecord?.uploadId ?? null;

    if (!resumeUploadId) {
      setResumeLookup({ kind: "no_upload" });
      return;
    }

    setResumeLookup({ kind: "loading", uploadId: resumeUploadId });

    try {
      const statusResponse = await getUploadStatus(resumeUploadId);
      const mappedStatus = mapUploadStatus(statusResponse);
      const resolvedUploadId = mappedStatus.uploadId ?? resumeUploadId;

      if (mappedStatus.status === "processing") {
        setResumeLookup({ kind: "in_progress", uploadId: resolvedUploadId, statusResponse, mappedStatus });
        return;
      }

      setResumeLookup({ kind: "finished", uploadId: resolvedUploadId, statusResponse, mappedStatus });
    } catch (error) {
      const mapped = mapApiErrorToUploadFailure(error);

      if (mapped.reasonCode === "upload_not_found") {
        if (typeof window !== "undefined") {
          clearUploadResume(window.localStorage);
        }
        setResumeLookup({ kind: "no_upload" });
        return;
      }

      if (mapped.reasonCode === "session_expired") {
        setResumeLookup({ kind: "auth_error", uploadId: resumeUploadId, message: mapped.message });
        return;
      }

      setResumeLookup({ kind: "network_error", uploadId: resumeUploadId, message: mapped.message });
    }
  }, []);

  const clearResume = useCallback(() => {
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    setResumeLookup({ kind: "no_upload" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runResumeLookup();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [runResumeLookup]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Upload data</h1>
        <p className="text-base text-foreground/85">Follow the guided steps to validate your export and generate a production-ready report.</p>
        <p className="text-sm text-foreground/70">Report generation access depends on your billing plan.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadStepper resumeLookup={resumeLookup} onRetryResumeLookup={runResumeLookup} onClearResume={clearResume} />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">What you&apos;ll get</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Automated CSV validation before analysis.</li>
              <li>A generated report you can review in your dashboard.</li>
              <li>Clear warnings if any fields need attention.</li>
            </ul>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            {resumeLookup.kind === "loading" ? (
              <p className="mt-2 text-sm text-slate-600">Checking previous upload…</p>
            ) : null}

            {resumeLookup.kind === "in_progress" || resumeLookup.kind === "finished" ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700" data-testid="recent-uploads-summary">
                <p>Platform: {getPlatformLabel(resumeLookup.statusResponse)}</p>
                <p>Date: {formatLastUpdated(resumeLookup.statusResponse)}</p>
                <p>
                  Status: <span className="font-medium capitalize">{resumeLookup.mappedStatus.status === "ready" ? "Ready" : resumeLookup.mappedStatus.status === "failed" ? "Failed" : "Processing"}</span>
                </p>
              </div>
            ) : null}

            {resumeLookup.kind === "auth_error" ? (
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <p>Session expired while loading recent upload.</p>
                <Link href="/login" className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                  Sign in
                </Link>
              </div>
            ) : null}

            {resumeLookup.kind === "network_error" ? (
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <p>Couldn’t load your last upload.</p>
                <button type="button" onClick={() => void runResumeLookup()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                  Retry
                </button>
              </div>
            ) : null}

            {resumeLookup.kind === "idle" || resumeLookup.kind === "no_upload" ? (
              <>
                <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
                <p className="text-xs text-slate-500">Your validated uploads will appear here.</p>
              </>
            ) : null}
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
