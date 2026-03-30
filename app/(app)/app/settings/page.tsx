"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/client";
import { fetchWorkspaceDataSources, updateSourceSelection, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest } from "@/src/lib/api/upload";
import { buildAdvancedSourceDetails } from "@/src/lib/workspace/source-display";
import { buildUploadPlatformCardsFromManifest, normalizeSourceManifestResponse, type UploadPlatformCardMetadata } from "@/src/lib/upload/platform-metadata";
import { StatusPill } from "@/src/components/ui/status-pill";
import { buttonClassName } from "@/src/components/ui/button";
import { SkeletonBlock } from "../../_components/ui/skeleton";

type AdvancedSourceDetailRowProps = {
  detail: ReturnType<typeof buildAdvancedSourceDetails>[number];
  canToggle: boolean;
  toggleBusy: boolean;
  onToggle: () => void;
};

function AdvancedSourceDetailRow({ detail, canToggle, toggleBusy, onToggle }: AdvancedSourceDetailRowProps) {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-[#0f1d38]/90 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{detail.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {detail.sourceRole === "report_driving" ? "Report-driving" : "Optional context"}
          </p>
        </div>
        <StatusPill variant={detail.statusVariant}>{detail.statusLabel}</StatusPill>
      </div>

      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Included in next run</dt>
          <dd className="mt-1 text-slate-200">{detail.includedInNextRun ? "Included" : "Excluded"}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">File type support</dt>
          <dd className="mt-1 text-slate-200">{detail.fileTypeLabel ?? "See upload guide"}</dd>
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Notes</dt>
          <dd className="mt-1 text-slate-300">{detail.notes ?? "No additional notes."}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          disabled={!canToggle || toggleBusy}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {toggleBusy ? "Updating..." : detail.includedInNextRun ? "Exclude from next run" : "Include in next run"}
        </button>
        <Link href={detail.helpHref} className="text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white">
          Exact format help
        </Link>
      </div>
    </article>
  );
}

function AdvancedDataSourcesPanel() {
  const [visiblePlatformCards, setVisiblePlatformCards] = useState<UploadPlatformCardMetadata[] | null>(null);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPlatform, setTogglingPlatform] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [manifestResponse, workspaceResponse] = await Promise.all([
          getSourceManifest(),
          fetchWorkspaceDataSources(),
        ]);

        const normalizedManifest = normalizeSourceManifestResponse(manifestResponse);
        if (!normalizedManifest) {
          throw new Error("supported sources are temporarily unavailable");
        }

        if (!active) {
          return;
        }

        setVisiblePlatformCards(buildUploadPlatformCardsFromManifest(normalizedManifest));
        setWorkspaceDataSources(workspaceResponse);
      } catch {
        if (active) {
          setVisiblePlatformCards(null);
          setWorkspaceDataSources(null);
          setError("Advanced source details are temporarily unavailable.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const details = useMemo(
    () => (visiblePlatformCards ? buildAdvancedSourceDetails(visiblePlatformCards, workspaceDataSources?.sources ?? null) : []),
    [visiblePlatformCards, workspaceDataSources],
  );

  const handleToggle = async (platform: string, nextSelected: boolean) => {
    setTogglingPlatform(platform);
    setError(null);

    try {
      const updated = await updateSourceSelection(platform, nextSelected);
      setWorkspaceDataSources(updated);
    } catch {
      setError("Unable to update the source selection right now.");
    } finally {
      setTogglingPlatform(null);
    }
  };

  return (
    <section id="data-sources" className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent-teal">Data Sources</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Advanced source details</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Included-in-run controls, source roles, format notes, and failure details live here instead of the main Data page.
        </p>
      </div>

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`advanced-source-skeleton-${index + 1}`} className="rounded-[1.25rem] border border-white/10 bg-[#0f1d38]/90 p-5">
              <SkeletonBlock className="h-5 w-32 bg-white/10" />
              <SkeletonBlock className="mt-3 h-4 w-24 bg-white/10" />
              <SkeletonBlock className="mt-5 h-4 w-full bg-white/10" />
              <SkeletonBlock className="mt-2 h-4 w-4/5 bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="settings-data-sources-panel">
          {details.map((detail) => {
            const canToggle = detail.statusLabel !== "Not added" && detail.statusLabel !== "Processing";
            return (
              <AdvancedSourceDetailRow
                key={detail.id}
                detail={detail}
                canToggle={canToggle}
                toggleBusy={togglingPlatform === detail.id}
                onToggle={() => void handleToggle(detail.id, !detail.includedInNextRun)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = await createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(10,24,50,0.94),rgba(15,35,75,0.93),rgba(16,32,67,0.96))] px-6 py-5 shadow-brand-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Account actions and advanced data-source configuration live here.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={buttonClassName({
              variant: "secondary",
              className: "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-50",
            })}
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </section>

      <AdvancedDataSourcesPanel />
    </div>
  );
}
