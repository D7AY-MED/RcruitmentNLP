/**
 * useQuery — cached data fetching with stale-while-revalidate.
 *
 * Upgrade over `useAsync`: results are cached by `key` (see services/cache.ts),
 * so revisiting a page renders the previous data **instantly** while a fresh
 * copy loads in the background. In-flight requests are de-duplicated.
 *
 *   const { data, loading, validating, error, reload } =
 *     useQuery(`users:${page}:${search}`, () => listUsers({ page, search }));
 *
 * - `loading` is true only on the *first* fetch for a key (no cached data yet)
 *   → show a skeleton. On revisits `loading` is false and stale data shows
 *   immediately while `validating` is true.
 * - `reload()` forces a refetch (used after mutations alongside cache.invalidate).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getCached, isFresh, setCached, dedupe } from "../services/cache";
import { isAuthError } from "../services/client";

interface QueryResult<T> {
  data: T | undefined;
  loading: boolean;
  validating: boolean;
  error: string | null;
  reload: () => void;
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>): QueryResult<T> {
  const cached = getCached<T>(key);
  const [data, setData] = useState<T | undefined>(cached);
  const [loading, setLoading] = useState<boolean>(cached === undefined);
  const [validating, setValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(
    (force: boolean) => {
      const have = getCached<T>(key);
      if (have !== undefined) {
        setData(have);
        setLoading(false);
        if (isFresh(key) && !force) return; // fresh enough; skip network
      } else {
        setLoading(true);
      }
      setValidating(true);
      setError(null);
      dedupe(key, fetcherRef.current)
        .then((d) => {
          setCached(key, d);
          if (mounted.current) {
            setData(d as T);
            setError(null);
          }
        })
        .catch((e: any) => {
          if (mounted.current) {
            setError(isAuthError(e) ? "Your session has expired. Please sign in again." : e.message);
          }
        })
        .finally(() => {
          if (mounted.current) {
            setLoading(false);
            setValidating(false);
          }
        });
    },
    [key]
  );

  useEffect(() => {
    mounted.current = true;
    run(false);
    return () => {
      mounted.current = false;
    };
  }, [run]);

  return { data, loading, validating, error, reload: () => run(true) };
}
