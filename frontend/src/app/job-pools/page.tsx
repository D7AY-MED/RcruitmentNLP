'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Briefcase, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { deletePool as deletePoolMock, listPools as listPoolsMock, setPoolStatus as setPoolStatusMock } from '@/lib/frontendData';
import { listJobPools, updateJobPoolStatus, deleteJobPool } from '@/lib/jobPoolService';
import { JobPool } from '@/lib/types';
import JobPoolCard from '@/components/job-pools/JobPoolCard';
import CreateJobPoolModal from '@/components/job-pools/CreateJobPoolModal';
import { PageHeader } from '@/shared/components';

export default function JobPoolsPage({ autoCreate = false }: { autoCreate?: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pools, setPools] = useState<JobPool[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(autoCreate);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await listJobPools();
      setPools(data);
    } catch {
      setPools(listPoolsMock());
    } finally {
      setLoading(false);
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
    <div>
      <PageHeader
        title="Offres"
        subtitle="Gérez vos pools de recrutement."
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)} className="bg-brand hover:bg-brand-hover text-white rounded-xl">
            <Plus className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Créer une offre</span>
          </Button>
        }
      />
      <div className="space-y-5">

            {loading ? (
              <div className="bg-white dark:bg-card border border-border-brand rounded-2xl p-12 card-shadow flex flex-col items-center text-center justify-center min-h-[300px]">
                <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
                <p className="text-sm font-medium text-gray-500 dark:text-muted">Loading your job pools...</p>
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-card border border-border-brand rounded-2xl shadow-sm p-8 flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-ink mb-2">Could not load job pools</h3>
                <p className="text-gray-500 dark:text-muted mb-6">{error}</p>
                <Button variant="outline" onClick={refresh} className="rounded-xl border-border-brand">Retry</Button>
              </div>
            ) : pools.length === 0 ? (
              <div className="bg-white dark:bg-card border border-border-brand rounded-2xl shadow-sm p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-6">
                  <Briefcase className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">No job pools yet</h3>
                <p className="text-gray-505 dark:text-muted max-w-md mb-8 leading-relaxed text-sm">
                  Create your first pool to generate a public application link you can preview.
                </p>
                <Button onClick={() => setModalOpen(true)} className="bg-brand hover:bg-brand-hover text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create New Pool
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {pools.slice(0, visibleCount).map((pool) => (
                    <JobPoolCard
                      key={pool.id}
                      pool={pool}
                      busy={busyId === pool.id}
                      onView={() => navigate(`/recruiter/jobs/${pool.id}`)}
                      onStatusChange={(status) => handleStatusChange(pool, status)}
                      onDelete={() => handleDelete(pool)}
                    />
                  ))}
                </div>

                {pools.length > visibleCount && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="px-6 py-2 border-border-brand hover:border-brand/40 text-gray-700 dark:text-ink hover:bg-brand-light/50 transition-all rounded-xl font-semibold"
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
      </div>

      <CreateJobPoolModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => refresh()}
      />
      <Toaster />
    </div>
  );
}
