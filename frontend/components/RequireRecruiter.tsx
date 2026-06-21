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
import { useRouter } from 'next/navigation';
import { getToken, getCurrentRecruiter, logout } from '@/lib/recruiterAuth';

export default function RequireRecruiter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/recruiter/login');
      return;
    }

    // Token exists -> show the page, then verify it is still valid.
    setReady(true);

    getCurrentRecruiter().catch((err: any) => {
      const message = String(err?.message ?? '');
      const isAuthError = /invalid|expired|not authenticated|unauthor/i.test(message);
      if (isAuthError) {
        logout();
        router.replace('/recruiter/login');
      }
      // Otherwise (e.g. "Failed to fetch") keep the user signed in.
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
