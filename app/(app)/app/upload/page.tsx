"use client";

import { FeatureGuard } from "../../_components/feature-guard";
import UploadCard from "../_components/upload/UploadCard";
import UploadStepper from "../_components/upload/upload-stepper";

export default function UploadPage() {
  return (
    <FeatureGuard feature="upload">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Upload data</h1>
          <p className="text-gray-400">Follow the guided steps to validate your export and generate a production-ready report.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UploadStepper />
          </div>

          <div className="space-y-4">
            <UploadCard>
              <h3 className="text-base font-semibold text-white">What you&apos;ll get</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-300">
                <li>Automated CSV validation before analysis.</li>
                <li>A generated report you can review in your dashboard.</li>
                <li>Clear warnings if any fields need attention.</li>
              </ul>
            </UploadCard>

            <UploadCard>
              <h3 className="text-base font-semibold text-white">Recent uploads</h3>
              <p className="mt-2 text-sm text-gray-400">No uploads yet</p>
              <p className="text-xs text-gray-500">Your validated uploads will appear here.</p>
            </UploadCard>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
}
