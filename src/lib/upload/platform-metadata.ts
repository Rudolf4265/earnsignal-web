import type { SourceManifestPlatform, SourceManifestResponse, UploadPlatform } from "@/src/lib/api/upload";

export type PlatformCategory = "supported";
export type PlatformCardId = UploadPlatform | "direct-fan-platforms";
export type DirectFanPlatformId = "onlyfans" | "fansly" | "fanfix";
export type PlatformRole = "report-driving" | "supporting";
export type PublicSupportStatus = "supported_now" | "internal_only" | "not_supported";

export type NormalizedSourceManifestPlatform = {
  platform: UploadPlatform;
  label: string;
  descriptor: string;
  acceptedFileTypesLabel: string;
  uploadHelpText: string;
  publicSupportStatus: PublicSupportStatus;
  reportRole: PlatformRole;
  standaloneReportEligible: boolean;
  businessMetricsCapable: boolean;
  acceptedExtensions: string[];
  publicContractIds: string[];
  dataDomains: string[];
  roleSummary: string;
  knownLimitations: string[];
};

export type NormalizedSourceManifest = {
  version: number;
  eligibilityRule: string;
  businessMetricsRule: string;
  platforms: NormalizedSourceManifestPlatform[];
};

export type UploadPlatformCardMetadata = {
  id: UploadPlatform;
  label: string;
  subtitle: string;
  contributionLabel: string;
  fileTypeLabel: string;
  icon: string;
  category: PlatformCategory;
  available: boolean;
  guidance: string;
  platformRole: PlatformRole;
  publicSupportStatus: PublicSupportStatus;
  standaloneReportEligible: boolean;
  businessMetricsCapable: boolean;
  acceptedExtensions: string[];
  acceptedFileTypesLabel: string;
  roleSummary: string;
  knownLimitations: string[];
  dataDomains: string[];
};

export type DirectFanPlatformMetadata = {
  id: DirectFanPlatformId;
  label: string;
  subtitle: string;
  icon: string;
  available: boolean;
  backendId: UploadPlatform | null;
};

export const PLATFORM_CATEGORY_LABELS: Record<PlatformCategory, string> = {
  supported: "Supported",
};

export const PLATFORM_CATEGORY_ORDER: PlatformCategory[] = ["supported"];

export const DIRECT_FAN_PLATFORM_CARD_ID: PlatformCardId = "direct-fan-platforms";

const PLATFORM_ORDER: UploadPlatform[] = ["patreon", "substack", "youtube", "instagram", "tiktok"];

const PLATFORM_ICONS: Partial<Record<UploadPlatform, string>> = {
  patreon: "/platforms/patreon.svg",
  substack: "/platforms/substack.svg",
  youtube: "/platforms/youtube.png",
  instagram: "/platforms/instagram.svg",
  tiktok: "/platforms/tiktok.svg",
  onlyfans: "/platforms/direct-fan.png",
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry, index, items) => entry.length > 0 && items.indexOf(entry) === index);
}

function normalizePublicSupportStatus(value: unknown): PublicSupportStatus {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "supported_now" || normalized === "internal_only") {
    return normalized;
  }
  return "not_supported";
}

function normalizePlatformRole(value: unknown): PlatformRole {
  return normalizeString(value).toLowerCase() === "report_driving" ? "report-driving" : "supporting";
}

function normalizeManifestPlatform(raw: SourceManifestPlatform | null | undefined): NormalizedSourceManifestPlatform | null {
  const platform = raw?.platform;
  if (!platform || !PLATFORM_ORDER.includes(platform)) {
    return null;
  }

  return {
    platform,
    label: normalizeString(raw.label) || platform,
    descriptor: normalizeString(raw.descriptor),
    acceptedFileTypesLabel: normalizeString(raw.accepted_file_types_label ?? raw.acceptedFileTypesLabel),
    uploadHelpText: normalizeString(raw.upload_help_text ?? raw.uploadHelpText),
    publicSupportStatus: normalizePublicSupportStatus(raw.public_support_status ?? raw.publicSupportStatus),
    reportRole: normalizePlatformRole(raw.report_role ?? raw.reportRole),
    standaloneReportEligible:
      raw.standalone_report_eligible === true || raw.standaloneReportEligible === true,
    businessMetricsCapable:
      raw.business_metrics_capable === true || raw.businessMetricsCapable === true,
    acceptedExtensions: normalizeStringArray(raw.accepted_extensions ?? raw.acceptedExtensions),
    publicContractIds: normalizeStringArray(raw.public_contract_ids ?? raw.publicContractIds),
    dataDomains: normalizeStringArray(raw.data_domains ?? raw.dataDomains),
    roleSummary: normalizeString(raw.role_summary ?? raw.roleSummary),
    knownLimitations: normalizeStringArray(raw.known_limitations ?? raw.knownLimitations),
  };
}

function buildContributionLabel(platform: NormalizedSourceManifestPlatform): string {
  if (platform.reportRole === "supporting") {
    return "Performance support data";
  }
  if (platform.platform === "youtube") {
    return "Report-driving creator data";
  }
  return "Revenue & subscriber data";
}

function buildFileTypeLabel(platform: NormalizedSourceManifestPlatform): string {
  return platform.acceptedFileTypesLabel || "Supported file required";
}

function buildUploadPlatformCard(platform: NormalizedSourceManifestPlatform): UploadPlatformCardMetadata {
  return {
    id: platform.platform,
    label: platform.label,
    subtitle: platform.descriptor,
    contributionLabel: buildContributionLabel(platform),
    fileTypeLabel: buildFileTypeLabel(platform),
    icon: PLATFORM_ICONS[platform.platform] ?? "/platforms/direct-fan.png",
    category: "supported",
    available: platform.publicSupportStatus === "supported_now",
    guidance: platform.uploadHelpText || platform.roleSummary,
    platformRole: platform.reportRole,
    publicSupportStatus: platform.publicSupportStatus,
    standaloneReportEligible: platform.standaloneReportEligible,
    businessMetricsCapable: platform.businessMetricsCapable,
    acceptedExtensions: platform.acceptedExtensions,
    acceptedFileTypesLabel: platform.acceptedFileTypesLabel,
    roleSummary: platform.roleSummary,
    knownLimitations: platform.knownLimitations,
    dataDomains: platform.dataDomains,
  };
}

// Temporary compatibility shim for environments where `/v1/source-manifest`
// is unavailable. Backend truth is primary; this snapshot exists only so
// auth-gated pages can fail soft without inventing a second contract.
const FALLBACK_SOURCE_MANIFEST: NormalizedSourceManifest = {
  version: 1,
  eligibilityRule: "Add at least one report-driving source (Patreon, Substack, or YouTube) to run a combined report.",
  businessMetricsRule: "Reports are strongest when the staged workspace snapshot includes direct revenue or subscriber data.",
  platforms: [
    {
      platform: "patreon",
      label: "Patreon",
      descriptor: "Membership revenue",
      acceptedFileTypesLabel: "Normalized CSV only",
      uploadHelpText: "Upload the exact supported Patreon CSV for this workspace. Not every Patreon export CSV matches this contract.",
      publicSupportStatus: "supported_now",
      reportRole: "report-driving",
      standaloneReportEligible: true,
      businessMetricsCapable: true,
      acceptedExtensions: [".csv"],
      publicContractIds: ["patreon_normalized_csv"],
      dataDomains: ["revenue", "subscribers"],
      roleSummary: "Revenue and subscriber data. Can generate a report on its own.",
      knownLimitations: ["Exact normalized CSV template only", "Not every Patreon export CSV matches this contract"],
    },
    {
      platform: "substack",
      label: "Substack",
      descriptor: "Subscription revenue",
      acceptedFileTypesLabel: "Normalized CSV only",
      uploadHelpText: "Upload the exact supported Substack CSV for this workspace. Not every Substack export CSV matches this contract.",
      publicSupportStatus: "supported_now",
      reportRole: "report-driving",
      standaloneReportEligible: true,
      businessMetricsCapable: true,
      acceptedExtensions: [".csv"],
      publicContractIds: ["substack_normalized_csv"],
      dataDomains: ["revenue", "subscribers"],
      roleSummary: "Revenue and subscriber data. Can generate a report on its own.",
      knownLimitations: ["Exact normalized CSV template only", "Not every Substack export CSV matches this contract"],
    },
    {
      platform: "youtube",
      label: "YouTube",
      descriptor: "Creator earnings",
      acceptedFileTypesLabel: "CSV or allowlisted ZIP",
      uploadHelpText: "Upload the supported YouTube CSV or allowlisted ZIP for this workspace. Revenue and subscriber depth depends on the file you upload.",
      publicSupportStatus: "supported_now",
      reportRole: "report-driving",
      standaloneReportEligible: true,
      businessMetricsCapable: true,
      acceptedExtensions: [".csv", ".zip"],
      publicContractIds: ["youtube_normalized_csv", "youtube_takeout_zip"],
      dataDomains: ["revenue", "subscribers", "performance"],
      roleSummary: "Can generate a report. Revenue and subscriber depth depends on the YouTube file you upload.",
      knownLimitations: ["Exact normalized CSV template only", "Allowlisted ZIP support is limited to the approved archive shape"],
    },
    {
      platform: "instagram",
      label: "Instagram Performance",
      descriptor: "Social performance",
      acceptedFileTypesLabel: "CSV or allowlisted ZIP",
      uploadHelpText: "Upload the supported Instagram performance CSV or allowlisted ZIP. This source supports combined reports but cannot generate one alone.",
      publicSupportStatus: "supported_now",
      reportRole: "supporting",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      acceptedExtensions: [".csv", ".zip"],
      publicContractIds: ["instagram_performance_monthly_csv", "instagram_allowlisted_zip"],
      dataDomains: ["performance"],
      roleSummary: "Performance data only. Supports a combined report but cannot generate one alone.",
      knownLimitations: ["No revenue semantics", "Exact allowlisted ZIP shape only when using ZIP imports"],
    },
    {
      platform: "tiktok",
      label: "TikTok Performance",
      descriptor: "Social performance",
      acceptedFileTypesLabel: "CSV or allowlisted ZIP",
      uploadHelpText: "Upload the supported TikTok performance CSV or allowlisted ZIP. This source supports combined reports but cannot generate one alone.",
      publicSupportStatus: "supported_now",
      reportRole: "supporting",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      acceptedExtensions: [".csv", ".zip"],
      publicContractIds: ["tiktok_performance_monthly_csv", "tiktok_allowlisted_zip"],
      dataDomains: ["performance"],
      roleSummary: "Performance data only. Supports a combined report but cannot generate one alone.",
      knownLimitations: ["No revenue semantics", "Exact allowlisted ZIP shape only when using ZIP imports"],
    },
  ],
};

export function getFallbackSourceManifest(): NormalizedSourceManifest {
  return FALLBACK_SOURCE_MANIFEST;
}

export function normalizeSourceManifestResponse(raw: SourceManifestResponse | null | undefined): NormalizedSourceManifest | null {
  if (!raw || !Array.isArray(raw.platforms)) {
    return null;
  }

  const platforms = raw.platforms
    .map((platform) => normalizeManifestPlatform(platform))
    .filter((platform): platform is NormalizedSourceManifestPlatform => platform !== null)
    .sort((left, right) => PLATFORM_ORDER.indexOf(left.platform) - PLATFORM_ORDER.indexOf(right.platform));

  if (platforms.length === 0) {
    return null;
  }

  return {
    version: typeof raw.version === "number" && Number.isFinite(raw.version) ? raw.version : 1,
    eligibilityRule: normalizeString(raw.eligibility_rule ?? raw.eligibilityRule) || FALLBACK_SOURCE_MANIFEST.eligibilityRule,
    businessMetricsRule:
      normalizeString(raw.business_metrics_rule ?? raw.businessMetricsRule) || FALLBACK_SOURCE_MANIFEST.businessMetricsRule,
    platforms,
  };
}

export function buildUploadPlatformCardsFromManifest(
  manifest: NormalizedSourceManifest = FALLBACK_SOURCE_MANIFEST,
): UploadPlatformCardMetadata[] {
  return manifest.platforms.map(buildUploadPlatformCard);
}

export function getFallbackVisibleUploadPlatformCards(): UploadPlatformCardMetadata[] {
  return buildUploadPlatformCardsFromManifest(FALLBACK_SOURCE_MANIFEST);
}

export function getUploadPlatformCardsByIds(
  ids: readonly UploadPlatform[],
  manifest: NormalizedSourceManifest = FALLBACK_SOURCE_MANIFEST,
): UploadPlatformCardMetadata[] {
  const visibleIds = new Set(ids);
  return buildUploadPlatformCardsFromManifest(manifest).filter((card) => visibleIds.has(card.id));
}

export function groupPlatformCards(cards: UploadPlatformCardMetadata[]): Array<{
  category: PlatformCategory;
  label: string;
  items: UploadPlatformCardMetadata[];
}> {
  return PLATFORM_CATEGORY_ORDER.map((category) => ({
    category,
    label: PLATFORM_CATEGORY_LABELS[category],
    items: cards.filter((item) => item.category === category),
  })).filter((section) => section.items.length > 0);
}

export const DIRECT_FAN_PLATFORMS: DirectFanPlatformMetadata[] = [
  {
    id: "onlyfans",
    label: "OnlyFans",
    subtitle: "Direct creator subscriptions",
    icon: PLATFORM_ICONS.onlyfans,
    available: false,
    backendId: "onlyfans",
  },
  {
    id: "fansly",
    label: "Fansly",
    subtitle: "Direct creator subscriptions",
    icon: PLATFORM_ICONS.onlyfans,
    available: false,
    backendId: null,
  },
  {
    id: "fanfix",
    label: "Fanfix",
    subtitle: "Direct creator subscriptions",
    icon: PLATFORM_ICONS.onlyfans,
    available: false,
    backendId: null,
  },
];

export function resolveDirectFanBackendId(id: DirectFanPlatformId): UploadPlatform | null {
  const match = DIRECT_FAN_PLATFORMS.find((item) => item.id === id);
  return match?.backendId ?? null;
}
