import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentCandidate, logout as candidateLogout, type Candidate } from '@/lib/candidateAuth';
import { DashboardShell, type Crumb } from '@/shared/layout';

export type CandidateOutlet = { candidate: Candidate | null; refresh: () => void };

const SECTION_TITLES: Record<string, string> = {
  jobs: 'Découvrir les offres',
  recommended: 'Offres recommandées',
  applications: 'Mes candidatures',
  interviews: 'Mes entretiens',
  resume: 'Mon CV',
  insights: 'Insights carrière',
  profile: 'Mon profil',
  notifications: 'Notifications',
  settings: 'Paramètres',
};

/** Candidate shell — shared DashboardShell wired with candidate identity. */
export function CandidateShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const load = useCallback(() => {
    getCurrentCandidate()
      .then(setCandidate)
      .catch((e: { status?: number; message?: string }) => {
        // Expired / invalid session → send the candidate to re-login.
        const authErr =
          e?.status === 401 ||
          e?.status === 403 ||
          /not authenticated|invalid|expired|unauthor/i.test(e?.message || '');
        if (authErr) {
          candidateLogout();
          navigate('/login/candidate', { replace: true });
        }
      });
  }, [navigate]);
  useEffect(() => {
    load();
  }, [load]);

  const seg = location.pathname.replace(/^\/candidate\/?/, '').split('/')[0] || 'dashboard';
  const crumbs: Crumb[] =
    seg === 'dashboard'
      ? [{ label: 'Tableau de bord' }]
      : [{ label: 'Espace candidat', to: '/candidate/dashboard' }, { label: SECTION_TITLES[seg] ?? seg }];

  const onSignOut = () => {
    candidateLogout();
    navigate('/login/candidate', { replace: true });
  };

  const ctx: CandidateOutlet = { candidate, refresh: load };

  return (
    <DashboardShell
      role="candidate"
      user={{
        name: candidate?.full_name ?? 'Candidat',
        email: candidate?.email,
        meta: candidate?.title ?? candidate?.current_job_title ?? undefined,
        avatarUrl: candidate?.profile_picture_url ?? null,
      }}
      breadcrumbs={crumbs}
      onSignOut={onSignOut}
      searchPlaceholder="Rechercher des offres…"
      profileItems={[
        { label: 'Mon profil', to: '/candidate/profile' },
        { label: 'Paramètres', to: '/candidate/settings' },
      ]}
    >
      <Outlet context={ctx} />
    </DashboardShell>
  );
}

export default CandidateShell;
