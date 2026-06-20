/**
 * Administrator authentication client.
 *
 * Mirrors lib/recruiterAuth.ts and lib/candidateAuth.ts. Talks to the
 * same-origin Next.js route handlers under /api/admin/* (which authenticate
 * against Supabase Auth and verify admin_profiles membership server-side).
 * Stores the JWT in localStorage under `admin_token`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
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

/** Call the backend and surface a clean error message on failure. */
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// --- Token storage (localStorage) -----------------------------------------

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Authorization header for admin-protected API calls. Throws if signed out. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

// --- Auth actions ----------------------------------------------------------

export async function loginAdmin(email: string, password: string): Promise<Admin> {
  const data = await apiRequest<TokenResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.admin;
}

/** Fetch the currently authenticated administrator using the stored JWT. */
export async function getCurrentAdmin(): Promise<Admin> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Admin>('/api/admin/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
