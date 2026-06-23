const API_URL = import.meta.env.VITE_API_URL || '';

export function getToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

export function setToken(key: string, token: string): void {
  window.localStorage.setItem(key, token);
}

export function removeToken(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export function authHeader(key: string): Record<string, string> {
  const token = getToken(key);
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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
