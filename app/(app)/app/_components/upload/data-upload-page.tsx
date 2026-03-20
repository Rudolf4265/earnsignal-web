"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publicUrls } from "@earnsigma/config";
import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { getUploadSupportMatrix } from "@/src/lib/api/upload";
import {
  buildVisibleUploadPlatformCardsFromSupportMatrix,
  getFallbackVisibleUploadPlatformCards,
  getSupportedRevenueUploadFormatGuidanceFromCards,
  getSupportedRevenueUploadSummaryFromCards,
} from "@/src/lib/upload/support-surface";

const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = getFallbackVisibleUploadPlatformCards();

export default function DataUploadPage() {
  const [visiblePlatformCards, setVisiblePlatformCards] = useState(FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS);
  const supportedRevenueUploads = useMemo(
    () => getSupportedRevenueUploadSummaryFromCards(visiblePlatformCards),
    [visiblePlatformCards],
  );
  const supportedRevenueUploadFormatGuidance = useMemo(
    () => getSupportedRevenueUploadFormatGuidanceFromCards(visiblePlatformCards),
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Upload data</h1>
        <p className="text-slate-600">
          Upload a supported CSV to validate your workspace and unlock EarnSigma guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadCard className="mb-4 p-4">
            <div data-testid="upload-trust-strip">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-900">Your data stays private</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                Files are used only to generate your reports and operate the service. Never sold. Never used to train public AI models.
              </p>
              <Link
                href={publicUrls.dataPrivacy}
                className="mt-2 inline-flex text-xs font-medium text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
              >
                Learn how we handle your data
              </Link>
            </div>
          </UploadCard>
          <UploadStepper visiblePlatformCards={visiblePlatformCards} supportedRevenueUploads={supportedRevenueUploads} />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Current public upload options: {supportedRevenueUploads}.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {supportedRevenueUploadFormatGuidance}
              </p>
            </div>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step export instructions and troubleshooting in the upload guide.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open upload guide
            </Link>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
            <p className="mt-1 text-xs text-slate-500">Validated uploads appear here once you complete a supported CSV upload.</p>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
