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
  // Never let a request hang forever. If the caller didn't pass its own signal,
  // apply a 12s timeout so loading states always resolve.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let signal = options.signal ?? undefined;
  if (!signal) {
    const ctrl = new AbortController();
    timer = setTimeout(() => ctrl.abort(), 12000);
    signal = ctrl.signal;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw new Error('La requête a expiré. Réessayez.');
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let message: string;
    if (typeof body.detail === 'string') {
      message = body.detail;
    } else if (Array.isArray(body.detail)) {
      message = body.detail.map((e: any) => `${e.loc?.slice(1).join('.') || ''}: ${e.msg}`).join('; ');
    } else {
      message = `Request failed (${res.status})`;
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}
