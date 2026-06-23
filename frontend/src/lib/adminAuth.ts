import { apiRequest, authHeader as sharedAuthHeader, getToken as getSharedToken, removeToken, setToken } from './auth';

const TOKEN_KEY = 'admin_token';

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  admin: Admin;
}

export function getToken(): string | null {
  return getSharedToken(TOKEN_KEY);
}

export function logout(): void {
  removeToken(TOKEN_KEY);
}

export function authHeader(): Record<string, string> {
  return sharedAuthHeader(TOKEN_KEY);
}

export interface AdminRegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export async function registerAdmin(payload: AdminRegisterPayload, setupToken: string): Promise<Admin> {
  const data = await apiRequest<TokenResponse>('/api/v1/admin/register', {
    method: 'POST',
    headers: { 'x-admin-setup-token': setupToken },
    body: JSON.stringify(payload),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.admin;
}

export async function loginAdmin(email: string, password: string): Promise<Admin> {
  const data = await apiRequest<TokenResponse>('/api/v1/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.admin;
}

export async function getCurrentAdmin(): Promise<Admin> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Admin>('/api/v1/admin/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
