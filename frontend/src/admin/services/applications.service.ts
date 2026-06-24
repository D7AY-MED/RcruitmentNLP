/** Applications (interview_sessions) service. */
import { http } from "./client";
import type { ApplicationRow, ApplicationDetail } from "../types";

interface ListParams {
  search?: string;
  status?: "active" | "completed";
  pool_id?: string;
}

export function listApplications({ search, status, pool_id }: ListParams = {}): Promise<ApplicationRow[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (pool_id) params.set("pool_id", pool_id);
  const qs = params.toString();
  return http.get<ApplicationRow[]>(`/api/v1/admin/applications${qs ? `?${qs}` : ""}`);
}

export const getApplication = (sessionId: string) =>
  http.get<ApplicationDetail>(`/api/v1/admin/applications/${sessionId}`);
