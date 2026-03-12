import { resolveEntitlementSourceBadgeModel } from "@/src/lib/admin/entitlement-source-badge";

type AdminEntitlementSourceBadgeProps = {
  source: string | null | undefined;
  accessReasonCode?: string | null | undefined;
  className?: string;
};

function joinClassNames(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value && value.trim())).join(" ");
}

export function AdminEntitlementSourceBadge({ source, accessReasonCode, className }: AdminEntitlementSourceBadgeProps) {
  const badge = resolveEntitlementSourceBadgeModel({ source, accessReasonCode });
  return (
    <span className={joinClassNames([badge.className, className])} data-testid={`admin-source-badge-${badge.kind}`}>
      {badge.label}
    </span>
  );
}
