import RequireRecruiter from '@/components/RequireRecruiter';

/** Gate the whole /dashboard segment behind a recruiter session. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireRecruiter>{children}</RequireRecruiter>;
}
