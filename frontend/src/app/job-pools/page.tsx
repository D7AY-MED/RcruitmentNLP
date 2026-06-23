'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { deletePool as deletePoolMock, demoUser, listPools as listPoolsMock, setPoolStatus as setPoolStatusMock } from '@/lib/frontendData';
import { listJobPools, updateJobPoolStatus, deleteJobPool } from '@/lib/jobPoolService';
import { JobPool } from '@/lib/types';
import JobPoolCard from '@/components/job-pools/JobPoolCard';
import CreateJobPoolModal from '@/components/job-pools/CreateJobPoolModal';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';

export default function JobPoolsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pools, setPools] = useState<JobPool[]>([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const user = demoUser;

  const refresh = useCallback(async () => {
    setError('');
    try {
      const data = await listJobPools();
      setPools(data);
    } catch {
      setPools(listPoolsMock());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (pool: JobPool, status: JobPool['status']) => {
    setBusyId(pool.id);
    try {
      if (status === 'archived') {
        await deleteJobPool(pool.id);
        toast({ title: 'Archived', description: 'Pool archived.' });
      } else {
        const dbStatus = status === 'active';
        await updateJobPoolStatus(pool.id, dbStatus);
        toast({ title: 'Updated', description: `Pool set to ${status}.` });
      }
    } catch {
      setPoolStatusMock(pool.id, status);
      toast({ title: 'Updated (offline)', description: `Pool set to ${status} locally.` });
    }
    refresh();
    setBusyId(null);
  };

  const handleDelete = async (pool: JobPool) => {
    if (!window.confirm(`Delete "${pool.title}"?`)) return;
    setBusyId(pool.id);
    try {
      await deleteJobPool(pool.id);
      toast({ title: 'Deleted', description: 'Pool removed.' });
    } catch {
      deletePoolMock(pool.id);
      toast({ title: 'Deleted (offline)', description: 'Pool removed locally.' });
    }
    refresh();
    setBusyId(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader user={user} hrProfileId={user.id} />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-5xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Job Pools</h2>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">Create New Pool</span>
              </Button>
            </div>

            {error ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Could not load job pools</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <Button variant="outline" onClick={refresh}>Retry</Button>
              </div>
            ) : pools.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <Briefcase className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No job pools yet</h3>
                <p className="text-gray-500 max-w-md mb-8">
                  Create your first pool to generate a public application link you can preview.
                </p>
                <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create New Pool
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pools.map((pool) => (
                  <JobPoolCard
                    key={pool.id}
                    pool={pool}
                    busy={busyId === pool.id}
                    onView={() => navigate(`/job-pools/${pool.id}`)}
                    onStatusChange={(status) => handleStatusChange(pool, status)}
                    onDelete={() => handleDelete(pool)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <CreateJobPoolModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => refresh()}
        />
        <Toaster />
      </div>
    </div>
  );
}
