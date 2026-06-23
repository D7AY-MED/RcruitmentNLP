import { Outlet } from 'react-router-dom';
import RequireAdmin from '@/components/admin/RequireAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </RequireAdmin>
  );
}
