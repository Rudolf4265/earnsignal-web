import { cn } from "@earnsigma/ui";

type SampleReportSectionProps = {
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
};

/**
 * Wrapper for each of the 12 report sections.
 * The `sample-report-section` class is referenced in the print CSS
 * to insert page breaks between sections.
 */
export function SampleReportSection({
  children,
  className,
  divider = true,
}: SampleReportSectionProps) {
  return (
    <>
      {divider && (
        <div className="border-t border-brand-border/60" aria-hidden="true" />
      )}
      <div className={cn("sample-report-section py-16 sm:py-20", className)}>
        {children}
      </div>
    </>
  );
}

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

type SectionHeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight text-white sm:text-[1.85rem]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
