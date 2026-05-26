"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WelcomeModal } from "../WelcomeModal";
import { fetchOnboardingProfile } from "@/src/lib/api/profile";
import UploadStepper from "./upload-stepper";
import ReportWindowChooserDialog from "./report-window-chooser-dialog";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { StatusPill } from "@/src/components/ui/status-pill";
import { createReportRun, getReportErrorMessage, type CreateReportRunAnalysisWindow } from "@/src/lib/api/reports";
import { clearWorkspaceData, fetchWorkspaceDataSources, removeWorkspaceSource, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest, type UploadPlatform } from "@/src/lib/api/upload";
import { buildWorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import { resolveWorkspaceReportWindowPolicy } from "@/src/lib/workspace/report-window-policy";
import {
  buildSourceListItems,
  getPrimarySourceStatusLabel,
  getPrimarySourceStatusVariant,
  type SourceListAction,
  type SourceListItem,
} from "@/src/lib/workspace/source-display";
import {
  buildUploadPlatformCardsFromManifest,
  normalizeSourceManifestResponse,
  type NormalizedSourceManifest,
  type UploadPlatformCardMetadata,
} from "@/src/lib/upload/platform-metadata";
import { useEntitlementState } from "../../../_components/use-entitlement-state";
import { PlatformPayoutsSection } from "@/src/components/upload/platform-payouts-section";
import type { ReportDetailProSectionMode } from "@/src/lib/report/detail-gating";

type UploadPhase = 1 | 2 | 3;

type ReadyToRunBannerProps = {
  loading: boolean;
  ready: boolean;
  statusLabel: string;
  connectedCount: number;
  note: string;
  runLabel?: string;
  runDisabled?: boolean;
  onRunReport: () => void;
  onViewReports: () => void;
};

type SourceRowProps = {
  item: SourceListItem;
  onUploadAction: (platform: UploadPlatform) => void;
  onRemove?: (platform: UploadPlatform) => void;
};

type SourceListSectionProps = {
  items: SourceListItem[];
  loading: boolean;
  hasManifest: boolean;
  onAddSource: () => void;
  onUploadAction: (platform: UploadPlatform) => void;
  onRemove?: (platform: UploadPlatform) => void;
};

// ─── Platform logos shown in Phase 1 intro ───────────────────────────────────

const WIZARD_PLATFORMS = [
  { id: "patreon", label: "Patreon", logo: "/platforms/patreon.svg" },
  { id: "substack", label: "Substack", logo: "/platforms/substack.svg" },
  { id: "youtube", label: "YouTube", logo: "/platforms/youtube.png" },
  { id: "instagram", label: "Instagram", logo: "/platforms/instagram.svg" },
  { id: "tiktok", label: "TikTok", logo: "/platforms/tiktok.svg" },
] as const;

// ─── Wizard progress bar ─────────────────────────────────────────────────────

function WizardProgressBar({
  phase,
  onNavigateBack,
}: {
  phase: UploadPhase;
  onNavigateBack: (p: UploadPhase) => void;
}) {
  const steps: { label: string; phase: UploadPhase }[] = [
    { label: "Your platforms", phase: 1 },
    { label: "Additional income", phase: 2 },
    { label: "Review & run", phase: 3 },
  ];

  return (
    <nav aria-label="Upload steps" className="flex items-center gap-0">
      {steps.map(({ label, phase: stepPhase }, i) => {
        const isDone = stepPhase < phase;
        const isActive = stepPhase === phase;
        return (
          <div key={stepPhase} className="flex min-w-0 flex-1 items-center">
            <button
              type="button"
              disabled={!isDone}
              onClick={() => isDone && onNavigateBack(stepPhase)}
              className={[
                "flex items-center gap-2 text-left focus:outline-none",
                isDone ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isDone
                    ? "bg-brand-accent-emerald text-white"
                    : isActive
                      ? "bg-brand-accent-emerald text-white"
                      : "border border-white/20 bg-white/[0.04] text-slate-500",
                ].join(" ")}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  stepPhase
                )}
              </span>
              <span
                className={[
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={[
                  "mx-3 h-px flex-1",
                  stepPhase < phase ? "bg-brand-accent-emerald/50" : "bg-white/10",
                ].join(" ")}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Phase 1 intro: copy + platform logo pills ───────────────────────────────

function Phase1Intro({ connectedPlatformIds }: { connectedPlatformIds?: ReadonlySet<string> }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent-teal shrink-0" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h2 className="text-xl font-semibold text-white">Connect your platforms</h2>
        </div>
        <p className="text-sm leading-6 text-slate-400">
          Drop any export file below — we detect the platform automatically. We support:
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {WIZARD_PLATFORMS.map((p) => {
          const isConnected = connectedPlatformIds?.has(p.id) ?? false;
          return (
            <div
              key={p.id}
              className={[
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors",
                isConnected
                  ? "border-brand-accent-teal/50 bg-brand-accent-teal/10"
                  : "border-white/10 bg-white/[0.04]",
              ].join(" ")}
            >
              <Image
                src={p.logo}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
              />
              <span className={["text-xs font-medium", isConnected ? "text-teal-300" : "text-slate-300"].join(" ")}>
                {p.label}
              </span>
              {isConnected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="text-brand-accent-teal shrink-0">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase 2: income gate ────────────────────────────────────────────────────

function IncomeGate({
  answer,
  onAnswer,
}: {
  answer: "yes" | "no" | null;
  onAnswer: (v: "yes" | "no") => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent-teal shrink-0" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <h2 className="text-xl font-semibold text-white">Additional income</h2>
      </div>
      <p className="text-sm leading-6 text-slate-400">
        Think sponsorships, brand deals, or direct payments — income not tied to a platform account.
        This gets blended into your total earnings in the report.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onAnswer("yes")}
          className={[
            "flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
            answer === "yes"
              ? "border-brand-accent-teal/50 bg-brand-accent-teal/10 text-teal-300"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] hover:text-white",
          ].join(" ")}
        >
          Yes — upload a CSV
        </button>
        <button
          type="button"
          onClick={() => onAnswer("no")}
          className={[
            "flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
            answer === "no"
              ? "border-white/20 bg-white/[0.07] text-white"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] hover:text-white",
          ].join(" ")}
        >
          No, skip this step
        </button>
      </div>
    </section>
  );
}

// ─── Ready to run banner ─────────────────────────────────────────────────────

function ReadyToRunBanner({
  loading,
  ready,
  statusLabel,
  connectedCount,
  note,
  runLabel = "Run Report",
  runDisabled = false,
  onRunReport,
  onViewReports,
}: ReadyToRunBannerProps) {
  const countLabel = `${connectedCount} ${connectedCount === 1 ? "source" : "sources"} ready for this report`;

  return (
    <section
      className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(11,24,50,0.96),rgba(14,32,69,0.96),rgba(9,20,43,0.98))] p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.95)] sm:p-6"
      data-testid="workspace-run-report-section"
    >
      {loading ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-7 w-28 bg-white/10" />
            <SkeletonBlock className="h-8 w-52 bg-white/10" />
            <SkeletonBlock className="h-4 w-36 bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-11 w-36 bg-white/10" />
            <SkeletonBlock className="h-11 w-32 bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <StatusPill variant={ready ? "good" : connectedCount > 0 ? "warn" : "neutral"}>{statusLabel}</StatusPill>
            <div>
              <h2 className="text-2xl font-semibold text-white">Ready to run</h2>
              <p className="mt-1 text-sm text-slate-300">{countLabel}</p>
            </div>
            {note ? <p className="text-xs leading-5 text-slate-400">{note}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="staged-run-report"
              onClick={() => void onRunReport()}
              disabled={runDisabled}
              className={buttonClassName({
                variant: "primary",
                className:
                  "min-h-14 rounded-2xl border-brand-accent-emerald/55 bg-[linear-gradient(120deg,rgba(13,148,136,0.98),rgba(16,185,129,0.95))] px-7 py-3 text-base font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/75 hover:brightness-110 disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-400 sm:min-w-52",
              })}
            >
              {runLabel}
            </button>
            <button
              type="button"
              onClick={onViewReports}
              className={buttonClassName({
                variant: "secondary",
                className: "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08] hover:text-white",
              })}
            >
              View all reports
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Source list ─────────────────────────────────────────────────────────────

function renderAction(action: SourceListAction | undefined, onUploadAction: (platform: UploadPlatform) => void, variant: "primary" | "secondary") {
  if (!action) {
    return null;
  }

  if (action.kind === "link") {
    return (
      <Link
        href={action.href}
        className={
          variant === "secondary"
            ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
            : buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "h-9 rounded-xl border-white/10 bg-white/[0.04] px-3 text-slate-200 hover:bg-white/[0.08] hover:text-white",
              })
        }
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onUploadAction(action.platform)}
      className={
        variant === "secondary"
          ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
          : buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "h-9 rounded-xl border-white/10 bg-white/[0.04] px-3 text-slate-200 hover:bg-white/[0.08] hover:text-white",
            })
      }
    >
      {action.label}
    </button>
  );
}

function SourceRow({ item, onUploadAction, onRemove }: SourceRowProps) {
  const metaLabel =
    item.status === "fix_needed"
      ? item.issueLabel || "Needs review"
      : item.lastUpdatedLabel
        ? `Last updated ${item.lastUpdatedLabel}`
        : "No upload yet";

  return (
    <div
      className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between md:gap-4"
      data-testid={`workspace-source-row-${item.id}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/8">
          <Image src={item.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-sm font-semibold text-white">{item.name}</h3>
          <p className="text-xs leading-5 text-slate-400">{metaLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <StatusPill variant={getPrimarySourceStatusVariant(item.status)} className="text-[11px] tracking-wide">
          {getPrimarySourceStatusLabel(item.status)}
        </StatusPill>
        {renderAction(item.primaryAction, onUploadAction, "primary")}
        {renderAction(item.secondaryAction, onUploadAction, "secondary")}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-sm font-medium text-rose-400/70 underline underline-offset-4 transition hover:text-rose-300"
            aria-label={`Remove ${item.name} source`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function SourceRowsSkeleton() {
  return (
    <div className="divide-y divide-white/8">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={`workspace-source-skeleton-${index + 1}`} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-start gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24 bg-white/10" />
              <SkeletonBlock className="h-3 w-32 bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <SkeletonBlock className="h-6 w-24 rounded-full bg-white/10" />
            <SkeletonBlock className="h-9 w-24 rounded-xl bg-white/10" />
            <SkeletonBlock className="h-4 w-14 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySourceListState({ onAddSource, hasManifest }: { onAddSource: () => void; hasManifest: boolean }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-sm font-medium text-white">No sources added yet</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">Added and attempted uploads will appear here after you stage them.</p>
      <button
        type="button"
        onClick={onAddSource}
        disabled={!hasManifest}
        className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(59,130,246,0.8)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
      >
        Add your first source
      </button>
    </div>
  );
}

function ManifestUnavailableCard() {
  return (
    <section className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5">
      <div data-testid="source-manifest-unavailable" className="space-y-3">
        <h3 className="text-base font-semibold text-white">Supported sources unavailable</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          The supported source list could not be loaded, so uploads are paused until the manifest is available again.
        </p>
        <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Open upload guide
        </Link>
      </div>
    </section>
  );
}

function SourceListSection({
  items,
  loading,
  hasManifest,
  onAddSource,
  onUploadAction,
  onRemove,
}: SourceListSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.02]" data-testid="workspace-source-list-section">
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Your data sources</h2>
          <p className="mt-1 text-sm text-slate-400">Review the sources you have already added and keep your next report ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/app/settings#data-sources" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Advanced details
          </Link>
          <button
            type="button"
            onClick={onAddSource}
            disabled={!hasManifest}
            className="inline-flex h-10 items-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(59,130,246,0.8)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
          >
            Add source
          </button>
        </div>
      </div>

      {loading ? (
        <SourceRowsSkeleton />
      ) : hasManifest ? (
        items.length > 0 ? (
          <div className="divide-y divide-white/8">
            {items.map((item) => (
              <SourceRow key={item.id} item={item} onUploadAction={onUploadAction} onRemove={onRemove} />
            ))}
          </div>
        ) : (
          <EmptySourceListState onAddSource={onAddSource} hasManifest={hasManifest} />
        )
      ) : (
        <div className="p-5">
          <ManifestUnavailableCard />
        </div>
      )}
    </section>
  );
}

function UploadFlowSkeleton() {
  return (
    <section className="space-y-6 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48 bg-white/10" />
          <SkeletonBlock className="h-4 w-60 bg-white/10" />
        </div>
        <SkeletonBlock className="h-4 w-28 bg-white/10" />
      </div>
      <SkeletonBlock className="h-16 rounded-2xl bg-white/10" />
      <SkeletonBlock className="h-5 w-64 bg-white/10" />
      <SkeletonBlock className="h-64 rounded-[1.5rem] bg-white/10" />
    </section>
  );
}

function HelpSection({ sourceManifestError }: { sourceManifestError: string | null }) {
  return (
    <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Help</h2>
          <p className="mt-1 text-sm text-slate-400">
            {sourceManifestError
              ? `${sourceManifestError} Use the guide and troubleshooting while the source list recovers.`
              : "Keep the supporting references nearby without interrupting the main workflow."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          className="rounded-2xl border border-brand-accent-teal/20 bg-[linear-gradient(160deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-4"
          data-testid="workspace-example-resources"
        >
          <p className="text-sm font-semibold text-white">Example resources</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Open sample files and a sample report without leaving the main workflow.
          </p>
          <div className="mt-4 flex flex-col items-start gap-2">
            <Link href="/app/help#upload-guide" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
              See example files
            </Link>
            <Link href="/example" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
              View sample report
            </Link>
          </div>
        </div>

        <Link href="/app/help#upload-guide" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Upload Guide</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Format rules, supported files, and exact prep steps.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Open guide
          </span>
        </Link>

        <Link href="/app/help/troubleshooting" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Troubleshooting</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">What to check after a failed or slow upload.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Open troubleshooting
          </span>
        </Link>

        <Link href="/data-privacy" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Privacy</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">How uploads stay private and are used to operate the service.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Learn more
          </span>
        </Link>
      </div>
    </section>
  );
}

function DangerZoneClearData({
  confirming,
  pending,
  error,
  onRequestConfirm,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  pending: boolean;
  error: string | null;
  onRequestConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/[0.03] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold text-white">Clear all data</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Permanently removes all saved workspace sources. Report history is preserved. This cannot be undone.
          </p>
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {!confirming ? (
            <button
              type="button"
              onClick={onRequestConfirm}
              data-testid="clear-data-request"
              className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200"
            >
              Clear all data
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <p className="text-xs font-semibold text-rose-300">This will permanently delete all saved sources.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={pending}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={pending}
                  data-testid="clear-data-confirm"
                  className="rounded-xl bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
                >
                  {pending ? "Clearing..." : "Yes, clear all data"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildReadyBannerStatus(
  loading: boolean,
  canRunReport: boolean,
  connectedCount: number,
  reportHasBusinessMetrics: boolean,
): {
  statusLabel: string;
  note: string;
} {
  if (loading) {
    return {
      statusLabel: "Checking",
      note: "Checking your current source status.",
    };
  }

  if (canRunReport) {
    return {
      statusLabel: "Ready",
      note: reportHasBusinessMetrics
        ? ""
        : "Your sources are ready. Adding revenue + subscriber data will strengthen the report.",
    };
  }

  if (connectedCount > 0) {
    return {
      statusLabel: "Fix needed",
      note: "Connect or retry the source you need so the report is ready to run.",
    };
  }

  return {
    statusLabel: "No sources yet",
    note: "Add your first source to start building a report workspace.",
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DataUploadPage() {
  const router = useRouter();
  const entitlementState = useEntitlementState();
  const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;
  const platformPayoutsMode: ReportDetailProSectionMode = entitlementState.loading
    ? "loading-safe"
    : entitlementState.hasProAccess || entitlementState.isFounder
      ? "pro-unlocked"
      : "pro-locked";

  // ── Wizard phase state ──────────────────────────────────────────────────────
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>(1);
  const [incomeAnswer, setIncomeAnswer] = useState<"yes" | "no" | null>(null);
  const [incomeUploaderNonce, setIncomeUploaderNonce] = useState(0);

  // ── Existing state ──────────────────────────────────────────────────────────
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [sourceManifest, setSourceManifest] = useState<NormalizedSourceManifest | null>(null);
  const [visiblePlatformCards, setVisiblePlatformCards] = useState<UploadPlatformCardMetadata[] | null>(null);
  const [sourceManifestLoading, setSourceManifestLoading] = useState(true);
  const [sourceManifestError, setSourceManifestError] = useState<string | null>(null);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [preferredPlatform, setPreferredPlatform] = useState<UploadPlatform | null>(null);
  const [preferredPlatformNonce, setPreferredPlatformNonce] = useState(0);
  const workspaceDataSourcesRef = useRef<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [runReportPending, setRunReportPending] = useState(false);
  const [runReportError, setRunReportError] = useState<string | null>(null);
  const [analysisWindowDialogOpen, setAnalysisWindowDialogOpen] = useState(false);
  const [clearDataPending, setClearDataPending] = useState(false);
  const [clearDataConfirming, setClearDataConfirming] = useState(false);
  const [clearDataError, setClearDataError] = useState<string | null>(null);

  const workspaceReportState = useMemo(
    () =>
      buildWorkspaceReportState(workspaceDataSources === "loading" ? null : workspaceDataSources, {
        isLoading: workspaceDataSources === "loading",
        currentReportId,
      }),
    [currentReportId, workspaceDataSources],
  );

  const reportWindowPolicy = useMemo(
    () =>
      resolveWorkspaceReportWindowPolicy({
        reportModeAllowed: entitlementState.reportModeAllowed,
        maxReportMonths: entitlementState.maxReportMonths,
        canUseFullHistoryWindow: entitlementState.canUseFullHistoryWindow,
        coverageMonths: workspaceReportState.coverageMonths,
        coverageStart: workspaceReportState.coverageStart,
        coverageEnd: workspaceReportState.coverageEnd,
        monthsPresent: workspaceReportState.monthsPresent,
      }),
    [
      entitlementState.canUseFullHistoryWindow,
      entitlementState.maxReportMonths,
      entitlementState.reportModeAllowed,
      workspaceReportState.coverageEnd,
      workspaceReportState.coverageMonths,
      workspaceReportState.coverageStart,
      workspaceReportState.monthsPresent,
    ],
  );

  const refreshWorkspaceDataSources = useCallback(async (options?: { preserveCurrent?: boolean }) => {
    const currentWorkspaceDataSources = workspaceDataSourcesRef.current;
    const preserveCurrent =
      options?.preserveCurrent ??
      (currentWorkspaceDataSources !== "loading" && currentWorkspaceDataSources !== null);

    if (!preserveCurrent) {
      setWorkspaceDataSources("loading");
    }

    try {
      const nextWorkspaceDataSources = await fetchWorkspaceDataSources();
      setWorkspaceDataSources(nextWorkspaceDataSources);
    } catch {
      if (!preserveCurrent) {
        setWorkspaceDataSources(null);
      }
    }
  }, []);

  const clearCurrentReport = useCallback(() => {
    setCurrentReportId(null);
  }, []);

  const handleReportCreated = useCallback((reportId: string) => {
    setCurrentReportId(reportId);
  }, []);

  const clearRunReportError = useCallback(() => {
    setRunReportError(null);
  }, []);

  const submitReportRun = useCallback(async (analysisWindow?: CreateReportRunAnalysisWindow | null) => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked) {
      return;
    }

    setRunReportPending(true);
    setRunReportError(null);

    try {
      const selectedPlatforms = workspaceReportState.includedSources.map((source) => source.platform);
      const result = await createReportRun({ selectedPlatforms, analysisWindow: analysisWindow ?? undefined });
      handleReportCreated(result.reportId);
      setAnalysisWindowDialogOpen(false);
      router.push(`/app/report/${result.reportId}`);
    } catch (error) {
      setRunReportError(getReportErrorMessage(error));
    } finally {
      setRunReportPending(false);
    }
  }, [handleReportCreated, reportAccessBlocked, router, runReportPending, workspaceReportState]);

  const handleRunReport = useCallback(async () => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked) {
      return;
    }

    if (reportWindowPolicy.requiresWindowChooser) {
      setRunReportError(null);
      setAnalysisWindowDialogOpen(true);
      return;
    }

    if (reportWindowPolicy.directRunMode === "full_history") {
      await submitReportRun({ mode: "full_history", startMonth: null, endMonth: null });
      return;
    }

    await submitReportRun();
  }, [
    reportWindowPolicy.directRunMode,
    reportWindowPolicy.requiresWindowChooser,
    runReportPending,
    submitReportRun,
    reportAccessBlocked,
    workspaceReportState.canRunReport,
    workspaceReportState.isLoading,
  ]);

  // When clicking "Upload" on a source row in Phase 3, go back to Phase 1
  const handleUploadAction = useCallback((platform: UploadPlatform) => {
    clearCurrentReport();
    setPreferredPlatform(platform);
    setPreferredPlatformNonce((current) => current + 1);
    setUploadPhase(1);

    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("workspace-uploader")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [clearCurrentReport]);

  const handleAddSource = useCallback(() => {
    setUploadPhase(1);
    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("workspace-uploader")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const handleClearData = useCallback(async () => {
    setClearDataPending(true);
    setClearDataError(null);
    try {
      await clearWorkspaceData();
      setClearDataConfirming(false);
      setUploadPhase(1);
      await refreshWorkspaceDataSources({ preserveCurrent: false });
    } catch {
      setClearDataError("Failed to clear data. Please try again.");
    } finally {
      setClearDataPending(false);
    }
  }, [refreshWorkspaceDataSources]);

  const handleRemoveSource = useCallback(async (platform: UploadPlatform) => {
    try {
      await removeWorkspaceSource(platform);
      await refreshWorkspaceDataSources({ preserveCurrent: true });
    } catch {
      // Non-fatal: workspace will still refresh on the next natural poll
    }
  }, [refreshWorkspaceDataSources]);

  useEffect(() => {
    workspaceDataSourcesRef.current = workspaceDataSources;
  }, [workspaceDataSources]);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        const state = await fetchOnboardingProfile();
        if (!cancelled && !state.onboarding_completed) {
          setWelcomeModalOpen(true);
        }
      } catch {
        // Non-fatal
      }
    };

    void checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const syncManifest = async () => {
      if (active) {
        setSourceManifestLoading(true);
        setSourceManifestError(null);
      }

      try {
        const manifest = await getSourceManifest();
        const normalized = normalizeSourceManifestResponse(manifest);
        if (!normalized) {
          throw new Error("invalid_source_manifest");
        }

        if (active) {
          setSourceManifest(normalized);
          setVisiblePlatformCards(buildUploadPlatformCardsFromManifest(normalized));
          setSourceManifestError(null);
        }
      } catch {
        if (active) {
          setSourceManifest(null);
          setVisiblePlatformCards(null);
          setSourceManifestError("Supported sources are temporarily unavailable.");
        }
      } finally {
        if (active) {
          setSourceManifestLoading(false);
        }
      }
    };

    void syncManifest();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshWorkspaceDataSources({ preserveCurrent: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshWorkspaceDataSources]);

  const sourceListItems = useMemo(
    () =>
      visiblePlatformCards
        ? buildSourceListItems(visiblePlatformCards, workspaceDataSources === "loading" ? null : workspaceDataSources?.sources ?? null)
        : [],
    [visiblePlatformCards, workspaceDataSources],
  );

  // All connected sources (used by ReadyToRunBanner)
  const connectedCount = useMemo(
    () => sourceListItems.filter((item) => item.status !== "not_connected").length,
    [sourceListItems],
  );

  // Platform sources only (excludes "other"/Additional Income) — gates Phase 1 → 2
  const platformConnectedCount = useMemo(
    () => sourceListItems.filter((item) => item.id !== "other" && item.status !== "not_connected").length,
    [sourceListItems],
  );

  // Whether Additional Income has been uploaded — gates Phase 2 → 3 when answer is "yes"
  const incomeSourceConnected = useMemo(
    () => sourceListItems.some((item) => item.id === "other" && item.status !== "not_connected"),
    [sourceListItems],
  );

  const readyBanner = useMemo(
    () =>
      buildReadyBannerStatus(
        workspaceReportState.isLoading,
        workspaceReportState.canRunReport,
        connectedCount,
        workspaceReportState.reportHasBusinessMetrics,
      ),
    [
      connectedCount,
      workspaceReportState.canRunReport,
      workspaceReportState.isLoading,
      workspaceReportState.reportHasBusinessMetrics,
    ],
  );

  const readyBannerNote = workspaceReportState.canRunReport ? reportWindowPolicy.summaryNote ?? readyBanner.note : readyBanner.note;

  const canProceedPhase2 =
    incomeAnswer === "no" || (incomeAnswer === "yes" && incomeSourceConnected);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {welcomeModalOpen && (
        <WelcomeModal onDismiss={() => setWelcomeModalOpen(false)} />
      )}

      {/* Page title — Phase 1 only */}
      {uploadPhase === 1 && (
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Your Report Workspace</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Upload your platform data, add any additional income, then run your report.
          </p>
        </section>
      )}

      {/* Wizard progress bar — always visible */}
      <WizardProgressBar
        phase={uploadPhase}
        onNavigateBack={(p) => setUploadPhase(p)}
      />

      {/* ── Phase 1: Upload platforms ─────────────────────────────────────── */}
      {uploadPhase === 1 && (
        <>
          <Phase1Intro
            connectedPlatformIds={new Set(
              sourceListItems
                .filter((item) => item.id !== "other" && item.status !== "not_connected")
                .map((item) => item.id),
            )}
          />

          <div id="workspace-uploader">
            {sourceManifestLoading ? (
              <UploadFlowSkeleton />
            ) : sourceManifest && visiblePlatformCards ? (
              <UploadStepper
                key="phase-1-stepper"
                sourceManifest={sourceManifest}
                visiblePlatformCards={visiblePlatformCards}
                workspaceReportState={workspaceReportState}
                refreshWorkspaceDataSources={() => refreshWorkspaceDataSources({ preserveCurrent: true })}
                clearCurrentReport={clearCurrentReport}
                onClearRunReportError={clearRunReportError}
                preferredPlatform={preferredPlatform}
                preferredPlatformNonce={preferredPlatformNonce}
              />
            ) : (
              <ManifestUnavailableCard />
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {platformConnectedCount > 0
                ? `${platformConnectedCount} platform ${platformConnectedCount === 1 ? "source" : "sources"} ready`
                : "Upload at least one platform file to continue"}
            </p>
            <button
              type="button"
              disabled={platformConnectedCount === 0}
              onClick={() => setUploadPhase(2)}
              className={buttonClassName({
                variant: "primary",
                className:
                  "rounded-xl disabled:border-white/10 disabled:bg-white/[0.08] disabled:text-slate-500",
              })}
            >
              Done with platforms →
            </button>
          </div>
        </>
      )}

      {/* ── Phase 2: Additional income ────────────────────────────────────── */}
      {uploadPhase === 2 && (
        <>
          <IncomeGate
            answer={incomeAnswer}
            onAnswer={(v) => {
              setIncomeAnswer(v);
              if (v === "yes") {
                setIncomeUploaderNonce((n) => n + 1);
              }
            }}
          />

          {incomeAnswer === "yes" && (
            <div id="workspace-uploader">
              {sourceManifestLoading ? (
                <UploadFlowSkeleton />
              ) : sourceManifest && visiblePlatformCards ? (
                <UploadStepper
                  key="phase-2-stepper"
                  sourceManifest={sourceManifest}
                  visiblePlatformCards={visiblePlatformCards}
                  workspaceReportState={workspaceReportState}
                  refreshWorkspaceDataSources={() => refreshWorkspaceDataSources({ preserveCurrent: true })}
                  clearCurrentReport={clearCurrentReport}
                  onClearRunReportError={clearRunReportError}
                  preferredPlatform={"other" as UploadPlatform}
                  preferredPlatformNonce={incomeUploaderNonce}
                  incomeMode={true}
                />
              ) : (
                <ManifestUnavailableCard />
              )}
            </div>
          )}

          <PlatformPayoutsSection mode={platformPayoutsMode} />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setUploadPhase(1)}
              className={buttonClassName({
                variant: "secondary",
                className: "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08] hover:text-white",
              })}
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={!canProceedPhase2}
              onClick={() => setUploadPhase(3)}
              className={buttonClassName({
                variant: "primary",
                className:
                  "rounded-xl disabled:border-white/10 disabled:bg-white/[0.08] disabled:text-slate-500",
              })}
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {/* ── Phase 3: Review & run ─────────────────────────────────────────── */}
      {uploadPhase === 3 && (
        <>
          <section className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">Review & run</h2>
            <p className="text-sm text-slate-400">
              Here's everything you've staged — run the report when you're ready.
            </p>
          </section>

          <SourceListSection
            items={sourceListItems}
            loading={workspaceDataSources === "loading" || sourceManifestLoading}
            hasManifest={Boolean(sourceManifest && visiblePlatformCards)}
            onAddSource={handleAddSource}
            onUploadAction={handleUploadAction}
            onRemove={(platform) => void handleRemoveSource(platform)}
          />

          {runReportError ? (
            <p className="text-sm text-rose-300" data-testid="staged-run-report-error">
              {runReportError}
            </p>
          ) : null}

          <ReadyToRunBanner
            loading={workspaceReportState.isLoading}
            ready={workspaceReportState.canRunReport}
            statusLabel={readyBanner.statusLabel}
            connectedCount={connectedCount}
            note={readyBannerNote}
            runLabel={reportWindowPolicy.runCtaLabel}
            runDisabled={runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked}
            onRunReport={handleRunReport}
            onViewReports={() => router.push("/app/report")}
          />

          <div>
            <button
              type="button"
              onClick={() => setUploadPhase(2)}
              className="text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
            >
              ← Back to additional income
            </button>
          </div>
        </>
      )}

      {/* ── Always-mounted dialog ─────────────────────────────────────────── */}
      <ReportWindowChooserDialog
        open={analysisWindowDialogOpen}
        busy={runReportPending}
        error={runReportError}
        latestSnapshotWindow={reportWindowPolicy.latestSnapshotWindow}
        onClose={() => {
          if (!runReportPending) {
            setAnalysisWindowDialogOpen(false);
          }
        }}
        onRunLatestWindow={() =>
          void submitReportRun(
            reportWindowPolicy.latestSnapshotWindow
              ? {
                  mode: "latest_3_months",
                  startMonth: reportWindowPolicy.latestSnapshotWindow.startMonth,
                  endMonth: reportWindowPolicy.latestSnapshotWindow.endMonth,
                }
              : null,
          )
        }
      />

      <HelpSection sourceManifestError={sourceManifestError} />

      <DangerZoneClearData
        confirming={clearDataConfirming}
        pending={clearDataPending}
        error={clearDataError}
        onRequestConfirm={() => setClearDataConfirming(true)}
        onCancel={() => {
          setClearDataConfirming(false);
          setClearDataError(null);
        }}
        onConfirm={() => void handleClearData()}
      />
    </div>
  );
}
