'use client';

/**
 * Client-side route guard for recruiter-only pages.
 *
 * The auth token is stored in localStorage (set by lib/recruiterAuth), so the
 * check must run in the browser:
 *   - No token            -> redirect to /recruiter/login (nothing rendered).
 *   - Token present       -> render immediately, then validate in the
 *                            background; on a real auth failure (401), log out
 *                            and redirect. Transient network errors are ignored
 *                            so a backend blip doesn't sign the user out.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getToken, getCurrentRecruiter, logout } from '@/lib/recruiterAuth';

export default function RequireRecruiter({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/recruiter/login', { replace: true });
      return;
    }

    // Token exists -> show the page, then verify it is still valid.
    setReady(true);

    getCurrentRecruiter().catch((err: any) => {
      const message = String(err?.message ?? '');
      const isAuthError = /invalid|expired|not authenticated|unauthor/i.test(message);
      if (isAuthError) {
        logout();
        navigate('/recruiter/login', { replace: true });
      }
      // Otherwise (e.g. "Failed to fetch") keep the user signed in.
    });
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-bg text-sm text-gray-500 dark:text-muted">
        Loading…
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
