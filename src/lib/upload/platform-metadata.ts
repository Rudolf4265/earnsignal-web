import type { SourceManifestPlatform, SourceManifestResponse, UploadPlatform } from "@/src/lib/api/upload";
import { STATIC_SOURCE_MANIFEST_RESPONSE } from "./source-manifest-static.generated";

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

const FALLBACK_PLATFORM_ICON = "/platforms/direct-fan.png";
const DIRECT_FAN_PLATFORM_ICON = PLATFORM_ICONS.onlyfans ?? FALLBACK_PLATFORM_ICON;

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

function normalizePublicSupportStatus(value: unknown): PublicSupportStatus | null {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "supported_now" || normalized === "internal_only" || normalized === "not_supported") {
    return normalized;
  }
  return null;
}

function normalizePlatformRole(value: unknown): PlatformRole | null {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "report_driving") {
    return "report-driving";
  }
  if (normalized === "supporting") {
    return "supporting";
  }
  return null;
}

function normalizeManifestPlatform(raw: SourceManifestPlatform | null | undefined): NormalizedSourceManifestPlatform | null {
  const platform = raw?.platform;
  if (!platform || !PLATFORM_ORDER.includes(platform)) {
    return null;
  }

  const label = normalizeString(raw.label);
  const acceptedFileTypesLabel = normalizeString(raw.accepted_file_types_label ?? raw.acceptedFileTypesLabel);
  const uploadHelpText = normalizeString(raw.upload_help_text ?? raw.uploadHelpText);
  const publicSupportStatus = normalizePublicSupportStatus(raw.public_support_status ?? raw.publicSupportStatus);
  const reportRole = normalizePlatformRole(raw.report_role ?? raw.reportRole);
  const acceptedExtensions = normalizeStringArray(raw.accepted_extensions ?? raw.acceptedExtensions);
  const roleSummary = normalizeString(raw.role_summary ?? raw.roleSummary);

  if (!label || !acceptedFileTypesLabel || !uploadHelpText || !publicSupportStatus || !reportRole || acceptedExtensions.length === 0 || !roleSummary) {
    return null;
  }

  return {
    platform,
    label,
    descriptor: normalizeString(raw.descriptor),
    acceptedFileTypesLabel,
    uploadHelpText,
    publicSupportStatus,
    reportRole,
    standaloneReportEligible:
      raw.standalone_report_eligible === true || raw.standaloneReportEligible === true,
    businessMetricsCapable:
      raw.business_metrics_capable === true || raw.businessMetricsCapable === true,
    acceptedExtensions,
    publicContractIds: normalizeStringArray(raw.public_contract_ids ?? raw.publicContractIds),
    dataDomains: normalizeStringArray(raw.data_domains ?? raw.dataDomains),
    roleSummary,
    knownLimitations: normalizeStringArray(raw.known_limitations ?? raw.knownLimitations),
  };
}

function buildContributionLabel(platform: NormalizedSourceManifestPlatform): string {
  if (platform.platform === "youtube") {
    return "Revenue + growth insights";
  }
  if (platform.reportRole === "supporting") {
    return "Growth insights + report coverage";
  }
  return "Revenue + subscriber data";
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
    icon: PLATFORM_ICONS[platform.platform] ?? FALLBACK_PLATFORM_ICON,
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

export function normalizeSourceManifestResponse(raw: SourceManifestResponse | null | undefined): NormalizedSourceManifest | null {
  if (!raw || !Array.isArray(raw.platforms)) {
    return null;
  }

  const eligibilityRule = normalizeString(raw.eligibility_rule ?? raw.eligibilityRule);
  const businessMetricsRule = normalizeString(raw.business_metrics_rule ?? raw.businessMetricsRule);
  if (!eligibilityRule || !businessMetricsRule) {
    return null;
  }

  const normalizedPlatforms = raw.platforms.map((platform) => normalizeManifestPlatform(platform));
  if (normalizedPlatforms.some((platform) => platform === null)) {
    return null;
  }

  const platforms = normalizedPlatforms
    .filter((platform): platform is NormalizedSourceManifestPlatform => platform !== null)
    .sort((left, right) => PLATFORM_ORDER.indexOf(left.platform) - PLATFORM_ORDER.indexOf(right.platform));

  if (platforms.length === 0) {
    return null;
  }

  return {
    version: typeof raw.version === "number" && Number.isFinite(raw.version) ? raw.version : 1,
    eligibilityRule,
    businessMetricsRule,
    platforms,
  };
}

const STATIC_SOURCE_MANIFEST = (() => {
  const normalized = normalizeSourceManifestResponse(STATIC_SOURCE_MANIFEST_RESPONSE);
  if (!normalized) {
    throw new Error("Static source manifest snapshot does not match the canonical backend contract.");
  }
  return normalized;
})();

export function getStaticSourceManifest(): NormalizedSourceManifest {
  return STATIC_SOURCE_MANIFEST;
}

export function buildUploadPlatformCardsFromManifest(
  manifest: NormalizedSourceManifest,
): UploadPlatformCardMetadata[] {
  return manifest.platforms.map(buildUploadPlatformCard);
}

export function getStaticVisibleUploadPlatformCards(): UploadPlatformCardMetadata[] {
  return buildUploadPlatformCardsFromManifest(STATIC_SOURCE_MANIFEST);
}

export function getPlatformRoleBadgeLabel(platformRole: PlatformRole): string {
  return platformRole === "report-driving" ? "Report-driving" : "Growth + report";
}

export function getPlatformRoleDetail(platformRole: PlatformRole): string {
  return platformRole === "report-driving"
    ? "Used for core revenue/subscriber analysis."
    : "Used in combined reports and growth insights.";
}

export function getUploadPlatformCardsByIds(
  ids: readonly UploadPlatform[],
  manifest: NormalizedSourceManifest,
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
    icon: DIRECT_FAN_PLATFORM_ICON,
    available: false,
    backendId: "onlyfans",
  },
  {
    id: "fansly",
    label: "Fansly",
    subtitle: "Direct creator subscriptions",
    icon: DIRECT_FAN_PLATFORM_ICON,
    available: false,
    backendId: null,
  },
  {
    id: "fanfix",
    label: "Fanfix",
    subtitle: "Direct creator subscriptions",
    icon: DIRECT_FAN_PLATFORM_ICON,
    available: false,
    backendId: null,
  },
];

export function resolveDirectFanBackendId(id: DirectFanPlatformId): UploadPlatform | null {
  const match = DIRECT_FAN_PLATFORMS.find((item) => item.id === id);
  return match?.backendId ?? null;
}
