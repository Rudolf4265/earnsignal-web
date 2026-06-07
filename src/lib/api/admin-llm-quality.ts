import { apiFetchJson } from "./client";

export type LLMQualityWindow = {
  run_count: number;
  avg_grounding: number | null;
  avg_specificity: number | null;
  avg_actionability: number | null;
  avg_composite: number | null;
};

export type ScoreDistribution = {
  poor: number;      // composite < 0.4
  fair: number;      // 0.4–0.6
  good: number;      // 0.6–0.8
  excellent: number; // >= 0.8
};

export type LLMQualityWorstRun = {
  run_id: string;
  creator_id: string;
  finished_at: string | null;
  composite: number | null;
  grounding: number | null;
};

export type AdminLLMQualityResponse = {
  last_7d: LLMQualityWindow;
  last_30d: LLMQualityWindow;
  all_time: LLMQualityWindow;
  score_distribution: ScoreDistribution;
  worst_runs: LLMQualityWorstRun[];
  runs_with_scores: number;
  runs_without_scores: number;
};

export async function fetchAdminLLMQuality(): Promise<AdminLLMQualityResponse> {
  return apiFetchJson<AdminLLMQualityResponse>(
    "admin.llmQuality",
    "/v1/admin/llm-quality",
  );
}
