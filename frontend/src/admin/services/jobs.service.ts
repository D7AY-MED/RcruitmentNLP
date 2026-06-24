/** Jobs (job_pools) service. */
import { http } from "./client";
import type { Job } from "../types";

interface ListParams {
  search?: string;
  status?: "active" | "inactive" | "archived";
}

export function listJobs({ search, status }: ListParams = {}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const qs = params.toString();
  return http.get<Job[]>(`/api/v1/admin/jobs${qs ? `?${qs}` : ""}`);
}

export const getJob = (id: string) => http.get<Job>(`/api/v1/admin/jobs/${id}`);

export const updateJob = (id: string, body: Record<string, any>) =>
  http.patch<Job>(`/api/v1/admin/jobs/${id}`, body);

export const deleteJob = (id: string) => http.del(`/api/v1/admin/jobs/${id}`);
