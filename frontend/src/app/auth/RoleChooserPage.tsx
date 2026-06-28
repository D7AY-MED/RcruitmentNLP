import { RoleChooser } from '@/shared/auth';
import type { AuthMode } from '@/shared/auth';

/** Route page for /login and /get-started. */
export default function RoleChooserPage({ mode }: { mode: AuthMode }) {
  return <RoleChooser mode={mode} />;
}
