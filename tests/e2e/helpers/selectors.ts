import type { Page } from "@playwright/test";

export const selectors = {
  dataPageHeading: /Your Report Workspace/i,
  uploadCta: "upload-drop-zone",
  runReportCta: "staged-run-report",
  sourceListSection: "workspace-source-list-section",
  sourceRow: (platform: string) => `workspace-source-row-${platform}`,
  sourceProcessingBadge: /Processing|Working|Checking/i,
  sourceReadyBadge: /Ready|Connected/i,
  sourceFailedBadge: /Failed|Fix needed|Needs review/i,
  reportList: "report-list",
  reportDetail: "report-content",
  reportPdfLocked: "report-pdf-locked",
  freeTeaser: "report-free-teaser",
  growthNavItem: "nav-growth",
  dashboardNavItem: "nav-dashboard",
  dashboardIntelligenceSurface: "dashboard-section-what-we-see",
};

export function sourceRow(page: Page, platform: string) {
  return page.getByTestId(selectors.sourceRow(platform));
}

export function runReportButton(page: Page) {
  return page.getByTestId(selectors.runReportCta);
}

export function reportList(page: Page) {
  return page.getByTestId(selectors.reportList);
}

export function reportDetail(page: Page) {
  return page.getByTestId(selectors.reportDetail);
}
