'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '@/lib/types';
import { getToken, getCurrentRecruiter, logout } from '@/lib/recruiterAuth';
import { fetchRecruiterProfile } from '@/lib/recruiterProfileService';

interface RecruiterContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const RecruiterContext = createContext<RecruiterContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function RecruiterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const r = await getCurrentRecruiter();
      // Build the base user from the auth response
      const baseUser: AuthUser = {
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        companyName: r.company_name,
      };

      // Try to enrich with full profile data from Supabase
      const profile = await fetchRecruiterProfile(r.id);
      if (profile) {
        baseUser.fullName = profile.full_name || baseUser.fullName;
        baseUser.companyName = profile.company_name || baseUser.companyName;
        baseUser.phone = profile.phone || undefined;
        baseUser.companyDescription = profile.company_description || undefined;
        baseUser.companyIndustry = profile.company_industry || undefined;
        baseUser.companySize = profile.company_size || undefined;
        baseUser.companyWebsite = profile.company_website || undefined;
        baseUser.companyLinkedinUrl = profile.company_linkedin_url || undefined;
        baseUser.companyEmail = profile.company_email || undefined;
        baseUser.companyPhone = profile.company_phone || undefined;
        baseUser.companyAddress = profile.company_address || undefined;
        baseUser.companyFoundedYear = profile.company_founded_year || undefined;
      }

      setUser(baseUser);
    } catch (err: any) {
      const msg = String(err?.message ?? '');
      if (/invalid|expired|not authenticated|unauthor/i.test(msg)) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <RecruiterContext.Provider value={{ user, loading, refreshUser }}>
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

export function useRecruiterContext(): RecruiterContextValue {
  return useContext(RecruiterContext);
}
