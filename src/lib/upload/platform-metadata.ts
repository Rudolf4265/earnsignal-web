import type { UploadPlatform } from "@/src/lib/api/upload";

export type PlatformCategory = "supported" | "creator" | "additional";
export type PlatformCardId = UploadPlatform | "direct-fan-platforms";
export type DirectFanPlatformId = "onlyfans" | "fansly" | "fanfix";
export type UploadPlatformImportMode = "direct_csv" | "normalized_csv";

export type UploadPlatformCardMetadata = {
  id: PlatformCardId;
  label: string;
  subtitle: string;
  icon: string;
  category: PlatformCategory;
  available: boolean;
  importMode: UploadPlatformImportMode;
  guidance?: string;
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
    subtitle: "Membership platform",
    icon: "/platforms/patreon.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.patreon ?? false,
    importMode: "direct_csv",
  },
  {
    id: "substack",
    label: "Substack",
    subtitle: "Newsletter subscriptions",
    icon: "/platforms/substack.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.substack ?? false,
    importMode: "direct_csv",
  },
  {
    id: "youtube",
    label: "YouTube",
    subtitle: "Video creator earnings",
    icon: "/platforms/youtube.png",
    category: "supported",
    available: AVAILABLE_PLATFORMS.youtube ?? false,
    importMode: "direct_csv",
  },
  {
    id: "instagram",
    label: "Instagram Performance",
    subtitle: "Template-based normalized CSV or selected supported ZIP",
    icon: "/platforms/instagram.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.instagram ?? false,
    importMode: "normalized_csv",
    guidance: "Upload a template-based normalized Instagram performance CSV or a selected supported Instagram ZIP export.",
  },
  {
    id: "tiktok",
    label: "TikTok Performance",
    subtitle: "Template-based normalized CSV or selected supported ZIP",
    icon: "/platforms/tiktok.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.tiktok ?? false,
    importMode: "normalized_csv",
    guidance: "Upload a template-based normalized TikTok performance CSV or a selected supported TikTok ZIP export.",
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

export const COMING_SOON_CHIP_PLATFORMS: { id: string; label: string; icon: string | null }[] = [
  { id: "twitch", label: "Twitch", icon: "/platforms/twitch.svg" },
  { id: "snapchat", label: "Snapchat", icon: "/platforms/snapchat.svg" },
];

