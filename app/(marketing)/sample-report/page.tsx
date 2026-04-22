import type { Metadata } from "next";
import { MarketingShell } from "../_components/marketing-shell";
import { SampleReportPage } from "@/src/components/sample-report/SampleReportPage";

export const metadata: Metadata = {
  title: "Sample Report",
  description:
    "See a complete private EarnSigma creator business report. Real findings, fictional creator — so you know exactly what your own report delivers before you pay.",
  openGraph: {
    title: "EarnSigma Sample Report — See exactly what you get",
    description:
      "A full 12-section creator business diagnostic built from real data. Income stability, platform concentration, subscriber churn, and next actions — all in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarnSigma Sample Report",
    description:
      "A complete creator business diagnostic. Income stability, platform concentration, subscriber churn, and next actions.",
  },
};

export default function SampleReportRoute() {
  return (
    <MarketingShell>
      <SampleReportPage />
    </MarketingShell>
  );
}
