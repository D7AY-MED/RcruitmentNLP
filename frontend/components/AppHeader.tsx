'use client';
import { AuthUser } from '@/lib/types';

export default function AppHeader({ 
  user, 
  hrProfileId, 
  refreshBalance = 0,
  children
}: { 
  user: AuthUser; 
  hrProfileId: string; 
  refreshBalance?: number;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {children}
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.email}</p>
                {user?.companyName && (
                  <p className="text-xs text-gray-500">{user.companyName}</p>
                )}
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Frontend Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
