import type { ReactNode } from "react";

type PanelCardProps = {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

function joinClassNames(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(" ");
}

export function PanelCard({
  title,
  description,
  rightSlot,
  children,
  className,
  contentClassName,
}: PanelCardProps) {
  return (
    <section className={joinClassNames(["rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card", className])}>
      {title || description || rightSlot ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-semibold text-brand-text-primary">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
          </div>
          {rightSlot ? <div>{rightSlot}</div> : null}
        </div>
      ) : null}
      <div className={joinClassNames([title || description || rightSlot ? "mt-5" : null, contentClassName])}>{children}</div>
    </section>
  );
}
