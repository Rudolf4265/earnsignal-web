import type { UploadPlatform } from "@/src/lib/api/upload";

export type PlatformCategory = "supported" | "creator" | "additional";
export type PlatformCardId = UploadPlatform | "direct-fan-platforms";
export type DirectFanPlatformId = "onlyfans" | "fansly" | "fanfix";
export type UploadPlatformImportMode = "direct_csv" | "csv_or_zip" | "allowlisted_zip";
export type PlatformRole = "report-driving" | "performance-only";

export type UploadPlatformCardMetadata = {
  id: PlatformCardId;
  label: string;
  subtitle: string;
  contributionLabel: string;
  fileTypeLabel?: string;
  icon: string;
  category: PlatformCategory;
  available: boolean;
  importMode: UploadPlatformImportMode;
  guidance?: string;
  platformRole: PlatformRole;
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
  creator: "Creator Platforms",
  additional: "Additional Platforms",
};

export const PLATFORM_CATEGORY_ORDER: PlatformCategory[] = ["supported", "creator", "additional"];

export const DIRECT_FAN_PLATFORM_CARD_ID: PlatformCardId = "direct-fan-platforms";

const AVAILABLE_PLATFORMS: Partial<Record<UploadPlatform, boolean>> = {
  patreon: true,
  substack: true,
  youtube: true,
  instagram: true,
  tiktok: true,
  onlyfans: false,
};

export const UPLOAD_PLATFORM_CARDS: UploadPlatformCardMetadata[] = [
  {
    id: "patreon",
    label: "Patreon",
    subtitle: "Membership revenue",
    contributionLabel: "Revenue & members",
    fileTypeLabel: "CSV only",
    icon: "/platforms/patreon.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.patreon ?? false,
    importMode: "direct_csv",
    platformRole: "report-driving",
    guidance: "Upload your Patreon Members CSV export. In Patreon: Audience → Members → Export CSV.",
  },
  {
    id: "substack",
    label: "Substack",
    subtitle: "Subscription revenue",
    contributionLabel: "Subscribers & revenue",
    fileTypeLabel: "CSV only",
    icon: "/platforms/substack.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.substack ?? false,
    importMode: "direct_csv",
    platformRole: "report-driving",
    guidance: "Upload your Substack subscriber export CSV. In Substack: Settings → Subscribers → Export.",
  },
  {
    id: "youtube",
    label: "YouTube",
    subtitle: "Creator earnings",
    contributionLabel: "Growth, content & revenue",
    fileTypeLabel: "CSV or ZIP",
    icon: "/platforms/youtube.png",
    category: "supported",
    available: AVAILABLE_PLATFORMS.youtube ?? false,
    importMode: "csv_or_zip",
    platformRole: "report-driving",
    guidance: "Upload your YouTube Analytics CSV or a supported YouTube Takeout ZIP. In YouTube Studio: Analytics → Advanced Mode → Export.",
  },
  {
    id: "instagram",
    label: "Instagram Performance",
    subtitle: "Social performance",
    contributionLabel: "Performance insights",
    fileTypeLabel: "Allowlisted ZIP",
    icon: "/platforms/instagram.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.instagram ?? false,
    importMode: "allowlisted_zip",
    platformRole: "performance-only",
    guidance: "Upload the official Instagram data export ZIP. In Instagram: Settings → Your activity → Download your information. Not every ZIP from Instagram will be accepted.",
  },
  {
    id: "tiktok",
    label: "TikTok Performance",
    subtitle: "Social performance",
    contributionLabel: "Performance insights",
    fileTypeLabel: "Allowlisted ZIP",
    icon: "/platforms/tiktok.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.tiktok ?? false,
    importMode: "allowlisted_zip",
    platformRole: "performance-only",
    guidance: "Upload the official TikTok data export ZIP. In TikTok: Settings → Privacy → Personalization and data → Download your data. Not every ZIP from TikTok will be accepted.",
  },
];

export function getUploadPlatformCardsByIds(ids: readonly UploadPlatform[]): UploadPlatformCardMetadata[] {
  const visibleIds = new Set(ids);
  return UPLOAD_PLATFORM_CARDS.filter((card): card is UploadPlatformCardMetadata & { id: UploadPlatform } =>
    visibleIds.has(card.id as UploadPlatform),
  );
}

export const DIRECT_FAN_PLATFORMS: DirectFanPlatformMetadata[] = [
  {
    id: "onlyfans",
    label: "OnlyFans",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.png",
    available: AVAILABLE_PLATFORMS.onlyfans ?? false,
    backendId: "onlyfans",
  },
  {
    id: "fansly",
    label: "Fansly",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.png",
    available: false,
    backendId: null,
  },
  {
    id: "fanfix",
    label: "Fanfix",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.png",
    available: false,
    backendId: null,
  },
];

export function groupPlatformCards(cards: UploadPlatformCardMetadata[] = UPLOAD_PLATFORM_CARDS): Array<{
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

export function resolveDirectFanBackendId(id: DirectFanPlatformId): UploadPlatform | null {
  const match = DIRECT_FAN_PLATFORMS.find((item) => item.id === id);
  return match?.backendId ?? null;
}

