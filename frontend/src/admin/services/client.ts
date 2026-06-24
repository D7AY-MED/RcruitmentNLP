/**
 * Admin API client.
 *
 * A single fetch wrapper used by every admin service. It injects the admin
 * bearer token, sets JSON headers, parses FastAPI error shapes (string detail or
 * 422 validation arrays), and signals auth failures so the app can bounce the
 * user to the login screen.
 *
 * The admin token lives in localStorage under ADMIN_TOKEN_KEY (shared with the
 * legacy key name so existing sessions keep working).
 */

const API_URL = import.meta.env.VITE_API_URL || "";

export const ADMIN_TOKEN_KEY = "admin_token";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AdminApiError";
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/** True when an error means "your session is no longer valid". */
export function isAuthError(err: unknown): boolean {
  return err instanceof AdminApiError && (err.status === 401 || err.status === 403);
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the bearer token (used by /login). */
  anonymous?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, anonymous, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (!anonymous) {
    const token = getAdminToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    let message: string;
    if (typeof payload.detail === "string") {
      message = payload.detail;
    } else if (Array.isArray(payload.detail)) {
      message = payload.detail
        .map((e: any) => `${e.loc?.slice(1).join(".") || ""}: ${e.msg}`)
        .join("; ");
    } else {
      message = `Request failed (${res.status})`;
    }
    throw new AdminApiError(message, res.status);
  }

  return (await res.json()) as T;
}

/** Trigger a browser download of a binary endpoint (CSV/XLSX export). */
async function download(path: string, filename: string): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new AdminApiError(`Export failed (${res.status})`, res.status);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
  download,
};
