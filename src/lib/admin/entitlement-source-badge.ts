export type EntitlementSourceBadgeKind =
  | "stripe"
  | "admin_override"
  | "founder_protected"
  | "trial"
  | "none"
  | "unknown";

export type EntitlementSourceBadgeModel = {
  kind: EntitlementSourceBadgeKind;
  label: string;
  className: string;
};

const BASE_CLASS_NAME =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide";

const CLASS_NAME_BY_KIND: Record<EntitlementSourceBadgeKind, string> = {
  stripe: "border-sky-300/45 bg-sky-500/18 text-sky-100",
  admin_override: "border-emerald-300/45 bg-emerald-500/18 text-emerald-100",
  founder_protected: "border-violet-300/45 bg-violet-500/20 text-violet-100",
  trial: "border-amber-300/45 bg-amber-500/18 text-amber-100",
  none: "border-slate-300/20 bg-slate-500/10 text-slate-300",
  unknown: "border-slate-300/25 bg-slate-500/14 text-slate-200",
};

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function humanizeSource(value: string | null): string {
  if (!value) {
    return "Unknown Source";
  }

  const collapsed = value.replace(/[_-]+/g, " ").trim();
  if (!collapsed) {
    return "Unknown Source";
  }

  return collapsed
    .split(/\s+/)
    .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1))
    .join(" ");
}

export function resolveEntitlementSourceBadgeModel(params: {
  source: string | null | undefined;
  accessReasonCode?: string | null | undefined;
}): EntitlementSourceBadgeModel {
  const source = normalize(params.source);
  const reasonCode = normalize(params.accessReasonCode);

  let kind: EntitlementSourceBadgeKind = "unknown";
  let label = "Unknown Source";

  if (reasonCode === "founder_protected") {
    kind = "founder_protected";
    label = "Founder";
  } else if (source === "stripe") {
    kind = "stripe";
    label = "Stripe";
  } else if (source === "admin_override") {
    kind = "admin_override";
    label = "Admin Override";
  } else if (source === "trial") {
    kind = "trial";
    label = "Trial";
  } else if (source === "none") {
    kind = "none";
    label = "Free / None";
  } else {
    label = humanizeSource(source);
  }

  return {
    kind,
    label,
    className: `${BASE_CLASS_NAME} ${CLASS_NAME_BY_KIND[kind]}`,
  };
}
