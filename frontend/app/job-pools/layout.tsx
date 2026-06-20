import RequireRecruiter from '@/components/RequireRecruiter';

/** Gate the whole /job-pools segment behind a recruiter session. */
export default function JobPoolsLayout({ children }: { children: React.ReactNode }) {
  return <RequireRecruiter>{children}</RequireRecruiter>;
}
