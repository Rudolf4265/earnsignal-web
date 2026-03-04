export interface ReportDetailResponse {
  id?: string;
  report_id?: string;
  reportId?: string;
  title?: string;
  name?: string;
  status?: string;
  summary?: string;
  description?: string;
  message?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  artifact_url?: string | null;
  artifact_json_url?: string | null;
}

export interface GenerateReportRequestContract {
  upload_id: string;
  platform: string;
}

export interface GenerateReportResponseContract {
  report_id: string;
  warnings?: string[];
}

export interface ReportListContractStatus {
  status: "unknown";
  note: "unknown/missing; requires backend confirmation";
}

export const REPORT_LIST_CONTRACT_STATUS: ReportListContractStatus = {
  status: "unknown",
  note: "unknown/missing; requires backend confirmation",
};
