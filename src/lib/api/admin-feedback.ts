import { apiFetchJson } from "./client";

export type FeedbackItem = {
  id: string;
  creator_id: string;
  feedback_type: "general" | "build_screen" | "review";
  rating: number | null;
  message: string | null;
  platform_requests: string[] | null;
  report_run_id: string | null;
  created_at: string;
};

export type AdminFeedbackListResponse = {
  items: FeedbackItem[];
  total: number;
  page: number;
  page_size: number;
};

export type PlatformRequestCount = {
  platform: string;
  count: number;
};

export type AdminFeedbackStatsResponse = {
  total_count: number;
  rated_count: number;
  avg_rating: number | null;
  rating_distribution: Record<string, number>;
  top_platform_requests: PlatformRequestCount[];
  by_type: { general: number; build_screen: number; review: number };
};

export type FeedbackTypeFilter = "all" | "general" | "build_screen" | "review";

export async function fetchAdminFeedback(opts?: {
  feedback_type?: FeedbackTypeFilter;
  page?: number;
  page_size?: number;
}): Promise<AdminFeedbackListResponse> {
  const params = new URLSearchParams();
  if (opts?.feedback_type && opts.feedback_type !== "all") {
    params.set("feedback_type", opts.feedback_type);
  }
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.page_size) params.set("page_size", String(opts.page_size));
  const qs = params.toString();
  return apiFetchJson<AdminFeedbackListResponse>(
    "admin.feedback.list",
    `/v1/admin/feedback${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchAdminFeedbackStats(): Promise<AdminFeedbackStatsResponse> {
  return apiFetchJson<AdminFeedbackStatsResponse>(
    "admin.feedback.stats",
    "/v1/admin/feedback/stats",
  );
}
