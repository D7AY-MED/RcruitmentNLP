/** Companies service (derived from hr_profiles on the backend). */
import { http } from "./client";
import type { Company } from "../types";

export function listCompanies(search?: string): Promise<Company[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return http.get<Company[]>(`/api/v1/admin/companies${qs}`);
}

export const getCompany = (key: string) =>
  http.get<Company>(`/api/v1/admin/companies/${encodeURIComponent(key)}`);

export const updateCompany = (key: string, body: Record<string, any>) =>
  http.put<Company>(`/api/v1/admin/companies/${encodeURIComponent(key)}`, body);
