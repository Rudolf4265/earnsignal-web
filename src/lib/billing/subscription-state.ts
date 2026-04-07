type CommercialTier = "free" | "report" | "pro";

export type SubscriptionStateInput = {
  effectivePlanTier: CommercialTier;
  accessGranted: boolean;
  entitlementSource: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean | null;
  currentPeriodEnd: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  portalUrl?: string | null;
};

export type SubscriptionStateViewModel = {
  stateLabel: string;
  description: string | null;
  showManageSubscription: boolean;
  manageSubscriptionLabel: string;
};

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function buildSubscriptionStateViewModel(input: SubscriptionStateInput): SubscriptionStateViewModel {
  const source = normalize(input.entitlementSource);
  const status = normalize(input.status);
  const endDate = formatDate(input.currentPeriodEnd);
  const hasManageableStripeSubscription = hasValue(input.stripeCustomerId) && hasValue(input.stripeSubscriptionId);

  if (source === "stripe") {
    if (input.accessGranted && input.cancelAtPeriodEnd) {
      return {
        stateLabel: "Canceling at period end",
        description: endDate ? `Pro remains active through ${endDate}.` : "Pro remains active until the current billing period ends.",
        showManageSubscription: hasManageableStripeSubscription,
        manageSubscriptionLabel: "Manage subscription",
      };
    }

    if (input.accessGranted) {
      return {
        stateLabel: "Active",
        description: "Pro renews automatically unless you cancel it.",
        showManageSubscription: hasManageableStripeSubscription,
        manageSubscriptionLabel: "Manage subscription",
      };
    }

    return {
      stateLabel: "Canceled",
      description: endDate ? `Pro ended on ${endDate}.` : "This subscription is no longer active.",
      showManageSubscription: hasManageableStripeSubscription,
      manageSubscriptionLabel: "Manage subscription",
    };
  }

  if (input.effectivePlanTier === "report" && input.accessGranted) {
    return {
      stateLabel: "Report owned",
      description: "You keep access to completed purchased reports.",
      showManageSubscription: false,
      manageSubscriptionLabel: "Manage subscription",
    };
  }

  if (input.effectivePlanTier === "pro" && input.accessGranted) {
    return {
      stateLabel: status === "active" ? "Active" : "Access active",
      description: "Pro access is active on this account.",
      showManageSubscription: false,
      manageSubscriptionLabel: "Manage subscription",
    };
  }

  return {
    stateLabel: "Free",
    description: "Upgrade when you need owned reports or ongoing Pro monitoring.",
    showManageSubscription: false,
    manageSubscriptionLabel: "Manage subscription",
  };
}
