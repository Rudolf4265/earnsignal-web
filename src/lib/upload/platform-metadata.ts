import type { UploadPlatform } from "@/src/lib/api/upload";

export type PlatformCategory = "supported" | "creator" | "additional";
export type PlatformCardId = UploadPlatform | "direct-fan-platforms";
export type DirectFanPlatformId = "onlyfans" | "fansly" | "fanfix";

export type UploadPlatformCardMetadata = {
  id: PlatformCardId;
  label: string;
  subtitle: string;
  icon: string;
  category: PlatformCategory;
  available: boolean;
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
  tiktok: false,
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
  },
  {
    id: "substack",
    label: "Substack",
    subtitle: "Newsletter subscriptions",
    icon: "/platforms/substack.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.substack ?? false,
  },
  {
    id: "youtube",
    label: "YouTube",
    subtitle: "Video creator earnings",
    icon: "/platforms/youtube.png",
    category: "supported",
    available: AVAILABLE_PLATFORMS.youtube ?? false,
  },
  {
    id: "instagram",
    label: "Instagram",
    subtitle: "Content & insights exports",
    icon: "/platforms/instagram.svg",
    category: "supported",
    available: AVAILABLE_PLATFORMS.instagram ?? false,
  },
  {
    id: DIRECT_FAN_PLATFORM_CARD_ID,
    label: "Direct fan platforms",
    subtitle: "Creator subscription platforms",
    icon: "/platforms/direct-fan.svg",
    category: "additional",
    available: true,
  },
];

export const DIRECT_FAN_PLATFORMS: DirectFanPlatformMetadata[] = [
  {
    id: "onlyfans",
    label: "OnlyFans",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.svg",
    available: AVAILABLE_PLATFORMS.onlyfans ?? false,
    backendId: "onlyfans",
  },
  {
    id: "fansly",
    label: "Fansly",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.svg",
    available: false,
    backendId: null,
  },
  {
    id: "fanfix",
    label: "Fanfix",
    subtitle: "Direct creator subscriptions",
    icon: "/platforms/direct-fan.svg",
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

export const COMING_SOON_CHIP_PLATFORMS: { id: string; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "twitch", label: "Twitch" },
  { id: "snapchat", label: "Snapchat" },
];

