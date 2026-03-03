"use client";

import { useCallback, useEffect, useState } from "react";

import { buildDashboardModel, type DashboardViewModel } from "@/src/lib/dashboard/model";
import { readUploadResume } from "@/src/lib/upload/resume";
import { DashboardView } from "./dashboard-view";

const emptyModel: DashboardViewModel = {
  recentReports: [],
  hasReports: false,
  dataStatus: {
    platformsConnected: "None (upload to connect)",
    coverageMonths: "—",
    coverageHint: "Available after first report",
    lastUpload: "—",
  },
};

export function DashboardPageClient() {
  const [model, setModel] = useState<DashboardViewModel>(emptyModel);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const nextModel = await buildDashboardModel({
        readLastUploadId: () => {
          if (typeof window === "undefined") {
            return null;
          }

          const resume = readUploadResume(window.localStorage);
          return resume?.uploadId ?? null;
        },
      });
      setModel(nextModel);
    } catch {
      setModel(emptyModel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return <DashboardView model={model} loading={loading} onRefresh={() => void loadDashboard()} />;
}

