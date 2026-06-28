import { Navigate, useParams } from 'react-router-dom';
import { AuthShell, AuthForm, isRole, authConfig } from '@/shared/auth';
import type { AuthMode } from '@/shared/auth';

/**
 * Route page for /login/:role and /register/:role.
 * - Unknown role → back to the chooser.
 * - register for an invite-only role (admin) → its login instead.
 */
export default function RoleAuthPage({ mode }: { mode: AuthMode }) {
  const { role } = useParams();

  if (!isRole(role)) {
    return <Navigate to={mode === 'register' ? '/get-started' : '/login'} replace />;
  }
  if (mode === 'register' && !authConfig[role].canRegister) {
    return <Navigate to={`/login/${role}`} replace />;
  }

  return (
    <AuthShell role={role} mode={mode}>
      <AuthForm role={role} mode={mode} />
    </AuthShell>
  );
}
