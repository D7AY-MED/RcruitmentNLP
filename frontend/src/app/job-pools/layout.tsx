import React from 'react';
import { Outlet } from 'react-router-dom';
import RequireRecruiter from '@/components/RequireRecruiter';

export default function JobPoolsLayout({ children }: { children?: React.ReactNode }) {
  return <RequireRecruiter>{children ?? <Outlet />}</RequireRecruiter>;
}
