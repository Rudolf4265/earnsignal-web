import type { UploadPlatformCardMetadata } from "../upload/platform-metadata";
import type { UploadPlatform } from "../api/upload";
import type { WorkspaceDataSource } from "../api/workspace";

export type PrimarySourceStatus = "connected" | "not_added" | "needs_attention";

export type SourceListAction =
  | {
      kind: "upload";
      label: string;
      platform: UploadPlatform;
    }
  | {
      kind: "link";
      label: string;
      href: string;
    };

export type SourceListItem = {
  id: UploadPlatform;
  name: string;
  summary: string;
  status: PrimarySourceStatus;
  lastUpdatedLabel: string | null;
  note: string;
  primaryAction: SourceListAction;
  secondaryAction?: SourceListAction;
};

export type AdvancedSourceDetail = {
  id: UploadPlatform;
  name: string;
  includedInNextRun: boolean;
  sourceRole: "report_driving" | "optional_context";
  statusLabel: string;
  statusVariant: "good" | "warn" | "neutral";
  fileTypeLabel?: string;
  notes?: string;
  helpHref: string;
};

const SETTINGS_DATA_SOURCES_HREF = "/app/settings#data-sources";
const UPLOAD_GUIDE_HREF = "/app/help#upload-guide";

function formatLastUpdated(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function resolveSourceSummary(card: UploadPlatformCardMetadata, source?: WorkspaceDataSource | null): string {
  const role = source?.reportRole === "report_driving" ? "report-driving" : source?.reportRole === "supporting" ? "supporting" : card.platformRole;
  return role === "report-driving" ? "Revenue + subscriber data" : "Audience/performance context";
}

function resolvePrimaryStatus(source?: WorkspaceDataSource | null): PrimarySourceStatus {
  if (!source || source.state === "missing") {
    return "not_added";
  }

  if (source.state === "failed") {
    return "needs_attention";
  }

  return "connected";
}

export function getPrimarySourceStatusLabel(status: PrimarySourceStatus): string {
  if (status === "connected") {
    return "Connected";
  }

  if (status === "needs_attention") {
    return "Needs attention";
  }

  return "Not added";
}

export function getPrimarySourceStatusVariant(status: PrimarySourceStatus): "good" | "warn" | "neutral" {
  if (status === "connected") {
    return "good";
  }

  if (status === "needs_attention") {
    return "warn";
  }

  return "neutral";
}

function resolveLastUpdated(source?: WorkspaceDataSource | null): string | null {
  return formatLastUpdated(source?.lastReadyAt ?? source?.lastUploadAt ?? null);
}

function resolveNote(status: PrimarySourceStatus, source?: WorkspaceDataSource | null, lastUpdatedLabel?: string | null): string {
  if (status === "not_added") {
    return "Not added yet.";
  }

  if (status === "needs_attention") {
    return source?.statusMessage?.trim() || "Upload failed. Retry needed.";
  }

  if (source?.state === "processing") {
    return source.statusMessage?.trim() || "Checking the latest upload.";
  }

  if (lastUpdatedLabel) {
    return `Last updated: ${lastUpdatedLabel}`;
  }

  return "Connected and ready.";
}

function resolvePrimaryAction(card: UploadPlatformCardMetadata, source?: WorkspaceDataSource | null): SourceListAction {
  if (!source || source.state === "missing") {
    return {
      kind: "upload",
      label: "Add source",
      platform: card.id,
    };
  }

  if (source.state === "failed") {
    return {
      kind: "upload",
      label: source.actionLabel === "Replace" ? "Replace source" : "Retry source",
      platform: card.id,
    };
  }

  if (source.state === "processing") {
    return {
      kind: "link",
      label: "View details",
      href: SETTINGS_DATA_SOURCES_HREF,
    };
  }

  return {
    kind: "upload",
    label: "Replace source",
    platform: card.id,
  };
}

function resolveSecondaryAction(source?: WorkspaceDataSource | null): SourceListAction | undefined {
  if (!source || source.state === "missing") {
    return {
      kind: "link",
      label: "Manage details",
      href: SETTINGS_DATA_SOURCES_HREF,
    };
  }

  return {
    kind: "link",
    label: "Manage details",
    href: SETTINGS_DATA_SOURCES_HREF,
  };
}

function resolveAdvancedStatus(source?: WorkspaceDataSource | null): {
  label: string;
  variant: "good" | "warn" | "neutral";
} {
  if (!source || source.state === "missing") {
    return {
      label: "Not added",
      variant: "neutral",
    };
  }

  if (source.state === "failed") {
    return {
      label: "Needs attention",
      variant: "warn",
    };
  }

  if (source.state === "processing") {
    return {
      label: "Processing",
      variant: "neutral",
    };
  }

  return {
    label: "Connected",
    variant: "good",
  };
}

export function buildSourceListItems(
  cards: UploadPlatformCardMetadata[],
  sources: WorkspaceDataSource[] | null | undefined,
): SourceListItem[] {
  const sourceLookup = new Map((sources ?? []).map((source) => [source.platform, source]));

  return cards.map((card) => {
    const source = sourceLookup.get(card.id) ?? null;
    const status = resolvePrimaryStatus(source);
    const lastUpdatedLabel = resolveLastUpdated(source);

    return {
      id: card.id,
      name: source?.label || card.label,
      summary: resolveSourceSummary(card, source),
      status,
      lastUpdatedLabel,
      note: resolveNote(status, source, lastUpdatedLabel),
      primaryAction: resolvePrimaryAction(card, source),
      secondaryAction: resolveSecondaryAction(source),
    };
  });
}

export function buildAdvancedSourceDetails(
  cards: UploadPlatformCardMetadata[],
  sources: WorkspaceDataSource[] | null | undefined,
): AdvancedSourceDetail[] {
  const sourceLookup = new Map((sources ?? []).map((source) => [source.platform, source]));

  return cards.map((card) => {
    const source = sourceLookup.get(card.id) ?? null;
    const status = resolveAdvancedStatus(source);

    return {
      id: card.id,
      name: source?.label || card.label,
      includedInNextRun: source?.includedInNextReport === true,
      sourceRole: source?.reportRole === "report_driving" || card.platformRole === "report-driving" ? "report_driving" : "optional_context",
      statusLabel: status.label,
      statusVariant: status.variant,
      fileTypeLabel: source?.acceptedFileTypesLabel || card.fileTypeLabel,
      notes: source?.statusMessage?.trim() || card.roleSummary || undefined,
      helpHref: UPLOAD_GUIDE_HREF,
    };
  });
}
