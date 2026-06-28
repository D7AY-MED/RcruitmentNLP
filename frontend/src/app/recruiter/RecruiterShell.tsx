import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { DashboardShell, type Crumb } from '@/shared/layout';
import { CTAButton } from '@/shared/components';
import { useRecruiter } from '@/lib/recruiter-context';
import { logout } from '@/lib/recruiterAuth';

const SECTION_TITLES: Record<string, string> = {
  jobs: 'Offres',
  candidates: 'Talents',
  applications: 'Candidatures',
  interviews: 'Entretiens',
  analytics: 'Analytique',
  notifications: 'Notifications',
  company: 'Entreprise',
  settings: 'Paramètres',
};

/** Recruiter shell — the shared DashboardShell wired with recruiter identity. */
export function RecruiterShell() {
  const user = useRecruiter();
  const navigate = useNavigate();
  const location = useLocation();

  const seg = location.pathname.replace(/^\/recruiter\/?/, '').split('/')[0] || 'dashboard';
  const crumbs: Crumb[] =
    seg === 'dashboard'
      ? [{ label: 'Tableau de bord' }]
      : [{ label: 'Espace recruteur', to: '/recruiter/dashboard' }, { label: SECTION_TITLES[seg] ?? seg }];

  const onSignOut = () => {
    logout();
    navigate('/login/recruiter', { replace: true });
  };

  return (
    <DashboardShell
      role="recruiter"
      user={{
        name: user.fullName ?? 'Recruteur',
        email: user.email,
        meta: user.companyName,
        avatarUrl: user.avatarUrl ?? null,
      }}
      breadcrumbs={crumbs}
      onSignOut={onSignOut}
      searchPlaceholder="Rechercher offres, candidats…"
      profileItems={[
        { label: 'Entreprise', to: '/recruiter/company' },
        { label: 'Paramètres', to: '/recruiter/settings' },
      ]}
      actions={
        <CTAButton to="/recruiter/jobs/new" size="sm">
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Créer une offre</span>
        </CTAButton>
      }
    >
      <Toaster />
      <Outlet />
    </DashboardShell>
  );
}

export default RecruiterShell;
