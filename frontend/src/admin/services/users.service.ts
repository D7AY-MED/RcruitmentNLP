/** Users (candidates + recruiters) service. */
import { http } from "./client";
import { invalidate } from "./cache";
import type { UserRow, UserType, Paginated } from "../types";

interface ListParams {
  search?: string;
  type?: UserType;
  page?: number;
  pageSize?: number;
}

export function listUsers({ search, type, page = 1, pageSize = 25 }: ListParams = {}): Promise<
  Paginated<UserRow>
> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (type) params.set("type", type);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  return http.get<Paginated<UserRow>>(`/api/v1/admin/users?${params.toString()}`);
}

/** Drop cached user lists after a mutation so the next read is fresh. */
export function invalidateUsers(): void {
  invalidate("users:");
  invalidate("dashboard:"); // counts/activity change too
}

export const getUser = (type: UserType, id: string) =>
  http.get<UserRow>(`/api/v1/admin/users/${type}/${id}`);

export const createCandidate = (body: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}) => http.post<UserRow>("/api/v1/admin/users/candidate", body);

export const createRecruiter = (body: {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  phone?: string;
}) => http.post<UserRow>("/api/v1/admin/users/recruiter", body);

export const updateUser = (type: UserType, id: string, body: Record<string, any>) =>
  http.put<UserRow>(`/api/v1/admin/users/${type}/${id}`, body);

export const disableUser = (type: UserType, id: string) =>
  http.post(`/api/v1/admin/users/${type}/${id}/disable`);

export const enableUser = (type: UserType, id: string) =>
  http.post(`/api/v1/admin/users/${type}/${id}/enable`);

export const deleteUser = (type: UserType, id: string) =>
  http.del(`/api/v1/admin/users/${type}/${id}`);

/** Admin sets a new password for any candidate/recruiter account. */
export const setUserPassword = (type: UserType, id: string, newPassword: string) =>
  http.post<{ ok: boolean; message: string }>(
    `/api/v1/admin/users/${type}/${id}/password`,
    { new_password: newPassword }
  );
