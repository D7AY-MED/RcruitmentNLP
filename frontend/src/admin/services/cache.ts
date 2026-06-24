/**
 * Tiny client-side request cache (stale-while-revalidate).
 *
 * Powers `useQuery`: navigating back to a page shows the previously-fetched data
 * **instantly** from this cache while a fresh copy is fetched in the background.
 * In-flight requests for the same key are de-duplicated so a remount or two
 * components asking for the same data only hit the network once.
 *
 * `invalidate(prefix)` is called after mutations so the affected lists refetch.
 */

interface Entry {
  data: unknown;
  ts: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** How long a cached entry is considered "fresh" (no background refetch). */
export const FRESH_MS = 30_000;

export function getCached<T>(key: string): T | undefined {
  const e = store.get(key);
  return e ? (e.data as T) : undefined;
}

export function isFresh(key: string): boolean {
  const e = store.get(key);
  return !!e && Date.now() - e.ts < FRESH_MS;
}

export function setCached(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

/** Remove every cache entry whose key starts with `prefix`. */
export function invalidate(prefix: string): void {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearCache(): void {
  store.clear();
  inflight.clear();
}

/** Run `fn`, sharing a single in-flight promise per key (request de-dupe). */
export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p as Promise<T>;
}
