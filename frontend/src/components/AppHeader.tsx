'use client';
import { AuthUser } from '@/lib/types';
import ProfileDropdown from './ProfileDropdown';

export default function AppHeader({ 
  user, 
  hrProfileId, 
  refreshBalance = 0,
  onProfileSaved,
  children
}: { 
  user: AuthUser; 
  hrProfileId: string; 
  refreshBalance?: number;
  onProfileSaved?: () => void;
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
            <ProfileDropdown user={user} onProfileSaved={onProfileSaved} />
          </div>
        </div>
      </div>
    </header>
  );
}
