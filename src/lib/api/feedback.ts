import { apiFetchJson } from "./client";

export type FeedbackSubmitPayload = {
  feedback_type: "general" | "build_screen" | "review";
  rating?: number | null;
  message?: string | null;
  platform_requests?: string[] | null;
  report_run_id?: string | null;
};

export type FeedbackSubmitResponse = {
  id: string;
  created_at: string;
};

export async function submitFeedback(
  payload: FeedbackSubmitPayload,
): Promise<FeedbackSubmitResponse> {
  return apiFetchJson<FeedbackSubmitResponse>("feedback.submit", "/v1/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
