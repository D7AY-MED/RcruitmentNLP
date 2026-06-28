/**
 * Admin shell — now mounted on the shared DashboardShell so admin, recruiter
 * and candidate look and behave like one product. Only the role (→ nav,
 * breadcrumbs, profile actions, sign-out) differs. Admin behaviour/routes are
 * unchanged; child routes still render through <Outlet/> inside the shell.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, UserCircle } from 'lucide-react';
import { DashboardShell, type Crumb } from '@/shared/layout';
import { useAdminAuth } from '../../context/AdminAuthContext';

const SECTION_TITLES: Record<string, string> = {
  users: 'Utilisateurs',
  companies: 'Entreprises',
  jobs: 'Offres',
  applications: 'Candidatures',
  reports: 'Rapports',
  settings: 'Paramètres',
};

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const seg = location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const crumbs: Crumb[] = seg
    ? [{ label: 'Administration', to: '/admin' }, { label: SECTION_TITLES[seg] ?? seg }]
    : [{ label: 'Tableau de bord' }];

  const onSignOut = async () => {
    await logout();
    navigate('/login/admin', { replace: true });
  };

  return (
    <DashboardShell
      role="admin"
      user={{
        name: admin?.full_name ?? 'Administrateur',
        email: admin?.email,
        meta: 'Administrateur',
        avatarUrl: null,
      }}
      breadcrumbs={crumbs}
      onSignOut={onSignOut}
      searchPlaceholder="Rechercher dans l'administration…"
      profileItems={[
        { label: 'Mon profil', to: '/admin/settings/profile', icon: UserCircle },
        { label: 'Paramètres', to: '/admin/settings', icon: Settings },
      ]}
    />
  );
}
