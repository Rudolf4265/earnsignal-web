"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import type { HelpPlatformAction } from "./help-platform-content";

type PlatformCardProps = {
  platform: string;
  icon: string;
  badge: string;
  reportRoleLabel: string;
  secondaryAction?: HelpPlatformAction | null;
  onOpenGuide: () => void;
  cardTestId: string;
};

function joinClassNames(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(" ");
}

function ActionCta({
  action,
  className,
  testId,
}: {
  action: HelpPlatformAction;
  className: string;
  testId?: string;
}) {
  if (action.kind === "download") {
    return (
      <a href={action.href} download={action.download} className={className} data-testid={testId}>
        {action.label}
      </a>
    );
  }

  if (action.kind === "link") {
    return (
      <Link href={action.href} className={className} data-testid={testId}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} data-testid={testId}>
      {action.label}
    </button>
  );
}

export default function PlatformCard({
  platform,
  icon,
  badge,
  reportRoleLabel,
  secondaryAction = null,
  onOpenGuide,
  cardTestId,
}: PlatformCardProps) {
  return (
    <article
      className={joinClassNames([
        "group relative overflow-hidden rounded-[1.6rem] border border-brand-border/70 bg-[linear-gradient(160deg,rgba(16,32,67,0.97),rgba(14,29,57,0.94),rgba(9,20,41,0.98))] p-5 shadow-brand-card transition duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-brand-border-strong/80 hover:shadow-[0_26px_64px_-42px_rgba(29,78,216,0.88)]",
      ])}
      data-testid={cardTestId}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_42%)] opacity-0 transition duration-200 ease-out group-hover:opacity-100" />

      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-border/80 bg-brand-panel-muted/65">
              <Image src={icon} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-brand-text-primary">{platform}</h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">{reportRoleLabel}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 rounded-full border border-brand-border/80 bg-brand-panel/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">
            {badge}
          </span>
        </div>

        <div className="mt-auto flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={onOpenGuide}
            data-testid={`${cardTestId}-guide`}
            className={buttonClassName({
              variant: "primary",
              size: "sm",
              className:
                "min-h-10 rounded-xl px-4 shadow-brand-glow transition duration-200 ease-out hover:brightness-110",
            })}
          >
            How to get your file
          </button>
          {secondaryAction ? (
            <ActionCta
              action={secondaryAction}
              testId={`${cardTestId}-secondary`}
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                className:
                  "min-h-10 rounded-xl border-brand-border-strong/70 bg-brand-panel/80 px-4 text-brand-text-primary hover:bg-brand-panel-muted/92",
              })}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
