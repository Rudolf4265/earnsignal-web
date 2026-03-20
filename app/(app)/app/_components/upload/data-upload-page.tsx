"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
        <h1 className="text-3xl font-semibold text-slate-900">Upload your data</h1>
        <p className="text-slate-600">
          Choose your platform and upload a supported file to generate your report.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr),minmax(20rem,0.95fr)]">
        <div>
          <UploadStepper visiblePlatformCards={visiblePlatformCards} supportedRevenueUploads={supportedRevenueUploads} />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                <li>Supported platforms: {supportedRevenueUploads}.</li>
                <li>Patreon, Substack, and YouTube are CSV only.</li>
                <li>Instagram Performance and TikTok Performance use template-based normalized CSV or selected supported ZIP.</li>
                <li>If a ZIP is rejected, upload a supported CSV instead.</li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{supportedRevenueUploadFormatGuidance}</p>
            </div>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step file prep, supported file guidance, and troubleshooting live in the upload guide.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open upload guide
            </Link>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
            <p className="mt-1 text-xs text-slate-500">Validated uploads appear here once you complete a supported upload.</p>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
