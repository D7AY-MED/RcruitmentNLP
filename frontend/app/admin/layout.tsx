'use client';

import { usePathname } from 'next/navigation';
import RequireAdmin from '@/components/admin/RequireAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';

/**
 * Layout for the whole /admin segment.
 *
 * The login page renders standalone (no guard, no sidebar) to avoid a redirect
 * loop; every other /admin route is gated behind an admin session and wrapped
 * with the admin sidebar shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">{children}</div>
      </div>
    </RequireAdmin>
  );
}
