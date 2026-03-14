import { buildDashboardViewModel, type BuildDashboardViewModelInput, type DashboardViewModel } from "./view-model";

export type EarnDashboardModel = DashboardViewModel;

export function buildEarnDashboardModel(input: BuildDashboardViewModelInput): EarnDashboardModel {
  return buildDashboardViewModel(input);
}
