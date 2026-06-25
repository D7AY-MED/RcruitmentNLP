import React from 'react';
import { Outlet } from 'react-router-dom';
import RequireRecruiter from '@/components/RequireRecruiter';
import { RecruiterProvider } from '@/lib/recruiter-context';

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  return (
    <RequireRecruiter>
      <RecruiterProvider>
        {children ?? <Outlet />}
      </RecruiterProvider>
    </RequireRecruiter>
  );
}
