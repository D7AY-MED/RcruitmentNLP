/** Reports service: analytics summary + CSV/Excel export downloads. */
import { http } from "./client";
import type { ReportSummary } from "../types";

export type ReportDataset =
  | "users"
  | "candidates"
  | "recruiters"
  | "companies"
  | "jobs"
  | "applications";

export const getSummary = () => http.get<ReportSummary>("/api/v1/admin/reports/summary");

export function exportDataset(dataset: ReportDataset, format: "csv" | "xlsx"): Promise<void> {
  return http.download(
    `/api/v1/admin/reports/export?dataset=${dataset}&format=${format}`,
    `poolink-${dataset}.${format}`
  );
}
