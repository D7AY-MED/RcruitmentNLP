/** Settings service: admin users, own profile, security, api-keys placeholder. */
import { http } from "./client";
import type { Admin } from "../types";

export const listAdmins = () => http.get<Admin[]>("/api/v1/admin/settings/admins");

export const createAdmin = (body: { full_name: string; email: string; password: string }) =>
  http.post<Admin>("/api/v1/admin/settings/admins", body);

export const deleteAdmin = (id: string) => http.del(`/api/v1/admin/settings/admins/${id}`);

export const updateProfile = (body: { full_name: string }) =>
  http.put<Admin>("/api/v1/admin/settings/profile", body);

export const changePassword = (newPassword: string) =>
  http.post<{ message: string; ok: boolean }>("/api/v1/admin/settings/security/password", {
    new_password: newPassword,
  });

export const getApiKeys = () =>
  http.get<{ supported: boolean; message: string; keys: any[] }>("/api/v1/admin/settings/api-keys");
