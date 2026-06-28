import RequireRecruiter from '@/components/RequireRecruiter';
import { RecruiterProvider } from '@/lib/recruiter-context';
import { RecruiterShell } from './RecruiterShell';

/** Recruiter layout route: existing guard + provider, on the shared shell. */
export default function RecruiterLayout() {
  return (
    <RequireRecruiter>
      <RecruiterProvider>
        <RecruiterShell />
      </RecruiterProvider>
    </RequireRecruiter>
  );
}
