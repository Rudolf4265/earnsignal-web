export type DashboardPrimaryCta = {
  kind: "upgrade" | "upload_data" | "generate_report" | "view_reports";
  label: "Upgrade" | "Upload data" | "Generate report" | "View reports";
  href: "/app/billing" | "/app/data" | "/app/report";
};

export type DashboardPrimaryCtaInput = {
  entitled: boolean;
  hasUploads: boolean;
  hasReports: boolean;
};

export function decideDashboardPrimaryCta(input: DashboardPrimaryCtaInput): DashboardPrimaryCta {
  if (!input.entitled) {
    return { kind: "upgrade", label: "Upgrade", href: "/app/billing" };
  }

  if (!input.hasUploads) {
    return { kind: "upload_data", label: "Upload data", href: "/app/data" };
  }

  if (!input.hasReports) {
    return { kind: "generate_report", label: "Generate report", href: "/app/data" };
  }

  return { kind: "view_reports", label: "View reports", href: "/app/report" };
}
