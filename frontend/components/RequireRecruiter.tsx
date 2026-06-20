'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getCurrentRecruiter, logout } from '@/lib/recruiterAuth';
import { RecruiterProvider } from '@/lib/recruiter-context';

export default function RequireRecruiter({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/recruiter/login');
      return;
    }

    setReady(true);

    getCurrentRecruiter().catch((err: any) => {
      const message = String(err?.message ?? '');
      const isAuthError = /invalid|expired|not authenticated|unauthor/i.test(message);
      if (isAuthError) {
        logout();
        router.replace('/recruiter/login');
      }
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return <RecruiterProvider>{children}</RecruiterProvider>;
}
