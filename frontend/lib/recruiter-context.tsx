'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/lib/types';
import { getToken, getCurrentRecruiter, logout } from '@/lib/recruiterAuth';

interface RecruiterContextValue {
  user: AuthUser | null;
  loading: boolean;
}

const RecruiterContext = createContext<RecruiterContextValue>({
  user: null,
  loading: true,
});

export function RecruiterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getCurrentRecruiter()
      .then((r) => {
        setUser({
          id: r.id,
          email: r.email,
          fullName: r.full_name,
          companyName: r.company_name,
        });
      })
      .catch((err: any) => {
        const msg = String(err?.message ?? '');
        if (/invalid|expired|not authenticated|unauthor/i.test(msg)) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <RecruiterContext.Provider value={{ user, loading }}>
      {children}
    </RecruiterContext.Provider>
  );
}

export function useRecruiter(): AuthUser {
  const ctx = useContext(RecruiterContext);
  if (!ctx.user) {
    return {
      id: 'demo-recruiter',
      email: 'recruiter@example.com',
      fullName: 'Demo Recruiter',
      companyName: 'xQuesty',
    };
  }
  return ctx.user;
}
