"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { buttonClassName } from "@/src/components/ui/button";
import type { HelpPlatformAction, HelpPlatformContent } from "./help-platform-content";

type PlatformHelpDrawerProps = {
  platform: HelpPlatformContent;
  visible: boolean;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function joinClassNames(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(" ");
}

function DrawerAction({
  action,
  className,
  onClose,
  testId,
}: {
  action: HelpPlatformAction;
  className: string;
  onClose: () => void;
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
    <button type="button" onClick={onClose} className={className} data-testid={testId}>
      {action.label}
    </button>
  );
}

function AccordionSection({
  id,
  title,
  items,
  defaultOpen = false,
  testId,
}: {
  id: string;
  title: string;
  items: string[];
  defaultOpen?: boolean;
  testId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[1.15rem] border border-brand-border/70 bg-brand-panel/72">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-[1.15rem] px-4 py-3 text-left transition-colors duration-200 ease-out hover:bg-brand-panel-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue/55"
        data-testid={`${testId}-toggle`}
      >
        <span className="text-sm font-semibold text-brand-text-primary">{title}</span>
        <span
          className={joinClassNames([
            "text-brand-text-muted transition duration-200 ease-out",
            open ? "rotate-45" : null,
          ])}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        id={id}
        className={joinClassNames([
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ])}
        data-testid={`${testId}-panel`}
      >
        <div className="min-h-0">
          <ul className="space-y-2 border-t border-brand-border/60 px-4 py-4 text-sm leading-6 text-brand-text-secondary">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function PlatformHelpDrawer({
  platform,
  visible,
  onClose,
}: PlatformHelpDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusCloseButton = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableNodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusableNodes || focusableNodes.length === 0) {
        event.preventDefault();
        return;
      }

      const focusable = Array.from(focusableNodes).filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1 && node.offsetParent !== null,
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusCloseButton);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      previousFocusedElement?.focus();
    };
  }, [onClose]);

  const acceptedFileLines = platform.acceptedFile.split("\n");

  return (
    <div
      className={joinClassNames([
        "fixed inset-0 z-50 flex justify-end bg-slate-950/62 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ])}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      data-testid="platform-help-drawer-backdrop"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={joinClassNames([
          "flex h-full w-full flex-col border-l border-brand-border-strong/70 bg-[linear-gradient(160deg,rgba(9,20,40,0.99),rgba(13,28,57,0.98),rgba(9,19,38,0.99))] shadow-[0_28px_90px_-34px_rgba(2,6,23,0.92)] transition-transform duration-[250ms] ease-out motion-reduce:transition-none",
          "sm:m-4 sm:h-[calc(100vh-2rem)] sm:max-w-[34rem] sm:rounded-[1.75rem] sm:border sm:border-brand-border-strong/75",
          visible ? "translate-x-0" : "translate-x-full",
        ])}
        data-testid="platform-help-drawer"
      >
        <div className="border-b border-brand-border/70 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">
                  {platform.name}
                </span>
                <span className="inline-flex rounded-full border border-brand-border/75 bg-brand-panel/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">
                  {platform.badge}
                </span>
              </div>
              <h2
                id={headingId}
                className="text-2xl font-semibold tracking-tight text-brand-text-primary"
                data-testid={`platform-help-drawer-${platform.id}-title`}
              >
                {platform.drawerTitle}
              </h2>
              <p id={descriptionId} className="max-w-xl text-sm leading-6 text-brand-text-secondary">
                {platform.intro}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border/80 bg-brand-panel/65 text-brand-text-secondary transition duration-200 ease-out hover:bg-brand-panel-muted/85 hover:text-brand-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue/60"
              data-testid="platform-help-drawer-close"
            >
              <span aria-hidden="true" className="text-sm font-semibold">
                X
              </span>
              <span className="sr-only">Close help drawer</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <section data-testid={`platform-help-drawer-${platform.id}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Steps</p>
              <ol className="mt-3 space-y-3">
                {platform.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-[1.15rem] border border-brand-border/60 bg-brand-panel/70 px-4 py-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-border-strong/70 bg-brand-panel-muted/85 text-xs font-semibold text-brand-text-primary">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-sm leading-6 text-brand-text-secondary">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className="rounded-[1.15rem] border border-brand-border/70 bg-[linear-gradient(165deg,rgba(19,41,80,0.8),rgba(14,31,63,0.78))] p-4"
              data-testid="platform-help-drawer-accepted"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Accepted file</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-brand-text-primary">
                {acceptedFileLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {platform.id === "youtube" ? (
                  <ul className="space-y-1.5 pl-4 text-brand-text-secondary">
                    <li>Table data.csv</li>
                    <li>Chart data.csv</li>
                    <li>Totals.csv</li>
                  </ul>
                ) : null}
                {platform.acceptedFileNote ? (
                  <p className="text-xs leading-5 text-brand-text-muted">{platform.acceptedFileNote}</p>
                ) : null}
              </div>
            </section>

            <AccordionSection
              id={`${platform.id}-before-upload`}
              title="Before you upload"
              items={platform.beforeUpload}
              testId={`platform-help-drawer-${platform.id}-before-upload`}
            />

            <AccordionSection
              id={`${platform.id}-common-mistakes`}
              title="Common mistakes"
              items={platform.commonMistakes}
              testId={`platform-help-drawer-${platform.id}-common-mistakes`}
            />
          </div>
        </div>

        <div className="border-t border-brand-border/70 bg-[linear-gradient(180deg,rgba(8,18,36,0.82),rgba(8,18,36,0.98))] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_40px_-30px_rgba(2,6,23,0.96)] backdrop-blur sm:px-6 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DrawerAction
              action={platform.primaryAction}
              onClose={onClose}
              testId={`platform-help-drawer-${platform.id}-primary`}
              className={buttonClassName({
                variant: "primary",
                size: "sm",
                className:
                  "min-h-10 justify-center rounded-xl px-4 shadow-brand-glow transition duration-200 ease-out hover:brightness-110 sm:min-w-52",
              })}
            />
            <DrawerAction
              action={platform.secondaryAction}
              onClose={onClose}
              testId={`platform-help-drawer-${platform.id}-secondary`}
              className={joinClassNames([
                platform.secondaryAction.kind === "link"
                  ? buttonClassName({
                      variant: "secondary",
                      size: "sm",
                      className:
                        "min-h-10 justify-center rounded-xl border-brand-border-strong/70 bg-brand-panel/80 px-4 text-brand-text-primary hover:bg-brand-panel-muted/92 sm:min-w-36",
                    })
                  : "inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-border/80 bg-brand-panel/72 px-4 text-sm font-medium text-brand-text-secondary transition duration-200 ease-out hover:bg-brand-panel-muted/88 hover:text-brand-text-primary sm:min-w-28",
              ])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
