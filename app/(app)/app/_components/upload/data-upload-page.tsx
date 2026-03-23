"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { getLatestUploadStatus, getUploadSupportMatrix } from "@/src/lib/api/upload";
import { mapUploadStatus } from "@/src/lib/upload/status";
import {
  buildVisibleUploadPlatformCardsFromSupportMatrix,
  getFallbackVisibleUploadPlatformCards,
} from "@/src/lib/upload/support-surface";

const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = getFallbackVisibleUploadPlatformCards();

type StagedSourceSummary = {
  status: "ready" | "validated" | "failed";
  reportId: string | null;
  updatedAt: string | null;
};

function StagedSourcesPanel({ stagedSource }: { stagedSource: StagedSourceSummary | null | "loading" }) {
  if (stagedSource === "loading") {
    return (
      <UploadCard>
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <p className="mt-2 text-sm text-slate-500">Checking workspace…</p>
      </UploadCard>
    );
  }

  if (!stagedSource) {
    return (
      <UploadCard>
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <p className="mt-2 text-sm text-slate-600">No sources staged yet.</p>
        <p className="mt-1 text-xs text-slate-500">Upload a supported file to stage your first source. Your report will combine all staged sources.</p>
      </UploadCard>
    );
  }

  const statusLabel =
    stagedSource.status === "ready"
      ? "Ready for report"
      : stagedSource.status === "validated"
      ? "Staged — upgrade to run"
      : "Needs attention";

  const statusColor =
    stagedSource.status === "ready"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : stagedSource.status === "validated"
      ? "text-sky-700 bg-sky-50 border-sky-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  const showNextBestAction = stagedSource.status === "validated";

  return (
    <UploadCard>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">Showing your most recent source</p>
      <p className="mt-2 text-xs text-slate-500">
        {stagedSource.status === "ready"
          ? "This source will be included in your next report run."
          : stagedSource.status === "validated"
          ? "Validated and staged. Run a report to include this source."
          : "This source needs attention. Try uploading again."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(stagedSource.status === "ready" || stagedSource.status === "validated") && stagedSource.reportId ? (
          <Link
            href={`/app/report/${stagedSource.reportId}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            View report
          </Link>
        ) : stagedSource.status === "validated" && !stagedSource.reportId ? (
          <div className="flex flex-col gap-1">
            <Link
              href="/app/billing"
              className="inline-flex rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
            >
              Run report
            </Link>
            <p className="text-[10px] text-slate-400">Combine your staged sources into one report.</p>
          </div>
        ) : null}
        <Link
          href="/app/report"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          All reports
        </Link>
      </div>
      {showNextBestAction ? (
        <p className="mt-3 text-xs text-slate-500" data-testid="staged-next-best-action">
          Add another source to improve your report accuracy.
        </p>
      ) : null}
      {stagedSource.updatedAt ? (
        <p className="mt-2 text-[10px] text-slate-400">Updated {new Date(stagedSource.updatedAt).toLocaleString()}</p>
      ) : null}
    </UploadCard>
  );
}

export default function DataUploadPage() {
  const [visiblePlatformCards, setVisiblePlatformCards] = useState(FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS);
  const [stagedSource, setStagedSource] = useState<StagedSourceSummary | null | "loading">("loading");

  const supportedRevenueUploads = useMemo(
    () => visiblePlatformCards.map((c) => c.label).join(", "),
    [visiblePlatformCards],
  );

  useEffect(() => {
    let active = true;

    const syncSupportSurface = async () => {
      try {
        const supportMatrix = await getUploadSupportMatrix();
        const nextVisiblePlatformCards = buildVisibleUploadPlatformCardsFromSupportMatrix(supportMatrix);
        if (active && nextVisiblePlatformCards) {
          setVisiblePlatformCards(nextVisiblePlatformCards);
        }
      } catch {
        // Keep the current safe fallback support surface.
      }
    };

    void syncSupportSurface();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchStagedSource = async () => {
      try {
        const latestStatus = await getLatestUploadStatus();
        if (!active) return;
        const mapped = mapUploadStatus(latestStatus);
        if (mapped.status === "ready" || mapped.status === "validated" || mapped.status === "failed") {
          setStagedSource({ status: mapped.status, reportId: mapped.reportId, updatedAt: mapped.updatedAt });
        } else {
          setStagedSource(null);
        }
      } catch {
        if (active) {
          setStagedSource(null);
        }
      }
    };

    void fetchStagedSource();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Your Report Workspace</h1>
        <p className="text-slate-600">
          Add your data sources to build a complete cross-platform report.
        </p>
        <p className="text-sm text-slate-500">You can add multiple sources before running your report.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr),minmax(20rem,0.95fr)]">
        <div>
          <UploadStepper visiblePlatformCards={visiblePlatformCards} supportedRevenueUploads={supportedRevenueUploads} />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-emerald-700" data-testid="label-report-driving">Report-driving</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>Patreon — native Members CSV export</li>
                    <li>Substack — native subscriber CSV export</li>
                    <li>YouTube — analytics CSV or Takeout ZIP</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-sky-700" data-testid="label-performance-only">Performance-only</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>Instagram — allowlisted ZIP export only</li>
                    <li>TikTok — allowlisted ZIP export only</li>
                  </ul>
                </div>
              </div>
            </div>
          </UploadCard>

          <StagedSourcesPanel stagedSource={stagedSource} />

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step file prep, supported format guidance, and troubleshooting in the upload guide.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open upload guide
            </Link>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
