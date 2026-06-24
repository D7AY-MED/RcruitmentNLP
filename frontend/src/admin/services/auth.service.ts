/** Admin authentication service. Wraps /api/v1/admin auth endpoints. */
import { http, setAdminToken, clearAdminToken, getAdminToken } from "./client";
import type { Admin, AdminTokenResponse } from "../types";

export async function login(email: string, password: string): Promise<Admin> {
  const data = await http.post<AdminTokenResponse>(
    "/api/v1/admin/login",
    { email, password },
    { anonymous: true }
  );
  setAdminToken(data.access_token);
  return data.admin;
}

export async function getCurrentAdmin(): Promise<Admin> {
  return http.get<Admin>("/api/v1/admin/me");
}

export async function logout(): Promise<void> {
  try {
    await http.post("/api/v1/admin/logout");
  } catch {
    /* token may already be invalid; clearing locally is enough */
  }
  clearAdminToken();
}

export function hasToken(): boolean {
  return !!getAdminToken();
}
