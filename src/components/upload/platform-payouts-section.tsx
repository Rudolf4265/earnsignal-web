"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProGate } from "@/src/components/ui/pro-gate";
import { fetchPlatformPayouts, updatePlatformPayouts, type PlatformPayoutEntry } from "@/src/lib/api/profile";
import type { ReportDetailProSectionMode } from "@/src/lib/report/detail-gating";

// ── Platform payout definitions ───────────────────────────────────────────────

type PayoutField = {
  key: string;
  label: string;
  description: string;
  platform: "tiktok" | "instagram" | "youtube";
};

const PAYOUT_FIELDS: PayoutField[] = [
  {
    key: "tiktok_creator_fund",
    label: "TikTok Creator Fund / Creator Rewards",
    description: "Monthly average from TikTok Creator Fund or Creator Rewards Program payouts.",
    platform: "tiktok",
  },
  {
    key: "ig_subscriptions",
    label: "Instagram Subscriptions",
    description: "Monthly income from Instagram subscriber badge fees.",
    platform: "instagram",
  },
  {
    key: "ig_reels_bonus",
    label: "Instagram Reels Bonus",
    description: "Monthly average from Instagram Reels Play Bonus program.",
    platform: "instagram",
  },
  {
    key: "youtube_memberships",
    label: "YouTube Channel Memberships",
    description: "Monthly income from YouTube Channel Member subscriptions.",
    platform: "youtube",
  },
];

const PLATFORM_ACCENT: Record<string, string> = {
  tiktok: "var(--es-color-text-primary)",
  instagram: "var(--es-color-accent-teal)",
  youtube: "#f87171",
};

// ── Component ─────────────────────────────────────────────────────────────────

type PlatformPayoutsSectionProps = {
  /** Pass proSectionGate.opportunity from the upload page's entitlement context */
  mode: ReportDetailProSectionMode;
};

type FieldValues = Record<string, string>;

export function PlatformPayoutsSection({ mode }: PlatformPayoutsSectionProps) {
  const [values, setValues] = useState<FieldValues>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing payouts on mount
  useEffect(() => {
    if (mode !== "pro-unlocked") return;
    fetchPlatformPayouts()
      .then((state) => {
        if (state.platform_payouts) {
          const fieldVals: FieldValues = {};
          for (const field of PAYOUT_FIELDS) {
            const entry = state.platform_payouts[field.key];
            if (entry && entry.monthly_avg > 0) {
              fieldVals[field.key] = String(entry.monthly_avg);
            }
          }
          setValues(fieldVals);
        }
      })
      .catch(() => setLoadError("Could not load saved platform payouts."));
  }, [mode]);

  const handleChange = useCallback(
    (key: string, raw: string) => {
      setValues((prev) => ({ ...prev, [key]: raw }));
      setSaved(false);

      // Debounced auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void handleSave({ ...values, [key]: raw });
      }, 1200);
    },
    [values],
  );

  const handleSave = useCallback(
    async (currentValues: FieldValues) => {
      setSaving(true);
      const payouts: Record<string, PlatformPayoutEntry> = {};
      for (const field of PAYOUT_FIELDS) {
        const raw = currentValues[field.key] ?? "";
        const num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
          payouts[field.key] = { monthly_avg: num, currency: "USD" };
        }
      }
      try {
        await updatePlatformPayouts(Object.keys(payouts).length > 0 ? payouts : null);
        setSaved(true);
      } catch {
        // Non-blocking — best effort
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const hasAnyValue = PAYOUT_FIELDS.some((f) => {
    const v = parseFloat(values[f.key] ?? "");
    return !isNaN(v) && v > 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Dollar icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          style={{ color: "var(--es-color-accent-teal)" }}
          aria-hidden="true"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-white">Platform payouts</h3>
          <p className="text-xs leading-5 text-slate-400">
            Enter monthly averages for platform-native monetization programs.
            These are added to your revenue total when your report is generated.
          </p>
        </div>
      </div>

      <ProGate
        mode={mode}
        feature="platform payout income"
        upgradeHref="/app/billing"
        className="min-h-[200px]"
      >
        <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          {loadError ? (
            <p className="text-xs text-rose-400">{loadError}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {PAYOUT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label
                  htmlFor={`payout-${field.key}`}
                  className="block text-xs font-medium text-slate-300"
                >
                  {field.label}
                </label>
                <p className="text-[11px] leading-4 text-slate-500">{field.description}</p>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">
                    $
                  </span>
                  <input
                    id={`payout-${field.key}`}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={values[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] py-2 pl-7 pr-3 text-sm text-white placeholder-slate-500 focus:border-brand-accent-teal/50 focus:outline-none focus:ring-1 focus:ring-brand-accent-teal/40"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save state indicator */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              {hasAnyValue
                ? "Amounts are saved automatically and included in your next report."
                : "Leave fields blank if not applicable."}
            </p>
            {saving ? (
              <span className="text-[11px] text-slate-400">Saving…</span>
            ) : saved ? (
              <span className="text-[11px]" style={{ color: "var(--es-color-accent-teal)" }}>
                ✓ Saved
              </span>
            ) : null}
          </div>
        </div>
      </ProGate>
    </div>
  );
}
