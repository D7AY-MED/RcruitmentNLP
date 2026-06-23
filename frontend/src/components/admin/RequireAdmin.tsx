'use client';

/**
 * Client-side route guard for administrator-only pages.
 *
 * Mirrors RequireRecruiter. The admin token is stored in localStorage
 * (lib/adminAuth), so the check must run in the browser:
 *   - No token         -> redirect to /admin/login (nothing rendered).
 *   - Token present     -> render immediately, then validate in the background;
 *                          on a real auth failure (401/403), log out and
 *                          redirect. Transient network errors are ignored so a
 *                          backend blip doesn't sign the admin out.
 */

import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getToken, getCurrentAdmin, logout } from '@/lib/adminAuth';

export default function RequireAdmin({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Token exists -> show the page, then verify it is still valid AND admin.
    setReady(true);

    getCurrentAdmin().catch((err: any) => {
      const message = String(err?.message ?? '');
      const isAuthError =
        /invalid|expired|not authenticated|unauthor|administrator|forbidden/i.test(message);
      if (isAuthError) {
        logout();
        navigate('/admin/login', { replace: true });
      }
      // Otherwise (e.g. "Failed to fetch") keep the admin signed in.
    });
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
