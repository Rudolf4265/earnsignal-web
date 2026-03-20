import Link from "next/link";
import { publicUrls } from "@earnsigma/config";
import { cn } from "@earnsigma/ui";

export const TRUST_MICROCOPY_HEADING = "Your data stays private";
export const TRUST_MICROCOPY_LINK_TEXT = "Learn how we handle your data";
export const MARKETING_TRUST_MICROCOPY_BODY =
  "Used only to generate your reports and operate the service. Never sold. Never used to train public AI models.";
export const UPLOAD_TRUST_MICROCOPY_BODY =
  "Files are used only to generate your reports and operate the service. Never sold. Never used to train public AI models.";

type TrustMicrocopyProps = {
  body: string;
  className?: string;
  testId?: string;
  variant: "marketing" | "app";
};

export function TrustMicrocopy({ body, className, testId, variant }: TrustMicrocopyProps) {
  const isMarketing = variant === "marketing";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        isMarketing
          ? "border-brand-border/65 bg-brand-panel/45 text-brand-text-secondary backdrop-blur-sm"
          : "border-slate-200 bg-slate-50/90 text-slate-700",
        className,
      )}
      data-testid={testId}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          isMarketing ? "text-brand-text-primary" : "text-slate-900",
        )}
      >
        {TRUST_MICROCOPY_HEADING}
      </p>
      <p
        className={cn(
          "mt-1.5 text-xs",
          isMarketing ? "leading-6 text-brand-text-secondary sm:text-[0.82rem]" : "leading-5 text-slate-600 sm:text-[0.82rem]",
        )}
      >
        {body}
      </p>
      <Link
        href={publicUrls.dataPrivacy}
        className={cn(
          "mt-2 inline-flex text-[11px] font-medium transition",
          isMarketing
            ? "tracking-[0.02em] text-brand-accent-teal hover:text-white"
            : "text-slate-700 underline underline-offset-4 hover:text-slate-900",
        )}
      >
        {TRUST_MICROCOPY_LINK_TEXT}
      </Link>
    </div>
  );
}
