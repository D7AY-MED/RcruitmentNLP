'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import { useRecruiter } from '@/lib/recruiter-context';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';

export default function DashboardPage() {
  const router = useRouter();
  const user = useRecruiter();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader user={user} hrProfileId={user.id} />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-2xl text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {user?.fullName || user?.email}
            </h2>
            <p className="text-gray-500 mb-8">
              Manage your job pools and candidate applications from one place.
            </p>
            <Button onClick={() => router.push('/job-pools')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Go to Job Pools
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
