import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthError } from "../services/client";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic data-fetching hook giving every page consistent loading/error/empty
 * handling. Pass an async function and its dependency list; call `reload()` to
 * refetch (e.g. after a mutation). Auth errors bubble up to RequireAdmin via a
 * full reload to /admin/login is handled by the client, so here we just surface
 * the message.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []): AsyncState<T> & {
  reload: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const mounted = useRef(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useCallback(fn, deps);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await memoFn();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err: any) {
      if (mounted.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: isAuthError(err) ? "Your session has expired. Please sign in again." : err.message,
        }));
      }
    }
  }, [memoFn]);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  return { ...state, reload: run };
}
