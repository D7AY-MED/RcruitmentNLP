/**
 * Recruiter authentication client.
 *
 * Thin wrapper around the FastAPI backend (/api/recruiter/*).
 * Stores the JWT in localStorage (simple approach for now, per spec).
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'recruiter_token';

export interface Recruiter {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  phone: string | null;
  created_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  phone?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  recruiter: Recruiter;
}

/** Call the backend and surface a clean error message on failure. */
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    // FastAPI puts error text under `detail`; fall back to a generic message.
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

// --- Auth actions ----------------------------------------------------------

export async function registerRecruiter(payload: RegisterPayload): Promise<Recruiter> {
  const data = await apiRequest<TokenResponse>('/api/v1/recruiter/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  return data.recruiter;
}

export async function loginRecruiter(email: string, password: string): Promise<Recruiter> {
  const data = await apiRequest<TokenResponse>('/api/v1/recruiter/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.recruiter;
}

/** Fetch the currently authenticated recruiter using the stored JWT. */
export async function getCurrentRecruiter(): Promise<Recruiter> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Recruiter>('/api/v1/recruiter/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
