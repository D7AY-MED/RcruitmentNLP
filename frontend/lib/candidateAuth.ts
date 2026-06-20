const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_KEY = 'candidate_token';

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  candidate: Candidate;
}

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

export async function registerCandidate(payload: RegisterPayload): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  return data.candidate;
}

export async function loginCandidate(email: string, password: string): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.candidate;
}

export async function getCurrentCandidate(): Promise<Candidate> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Candidate>('/api/candidate/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
