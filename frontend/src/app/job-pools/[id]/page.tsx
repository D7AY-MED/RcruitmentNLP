'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Archive, ArrowLeft, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { demoUser, getPool, listApplicants, publicPoolUrl, setPoolStatus as setPoolStatusMock } from '@/lib/frontendData';
import { getJobPool, updateJobPoolStatus } from '@/lib/jobPoolService';
import { JobPool, StudentApplicant } from '@/lib/types';
import JobPoolStatusBadge from '@/components/job-pools/JobPoolStatusBadge';
import CopyLinkButton from '@/components/job-pools/CopyLinkButton';
import ApplicantsList from '@/components/job-pools/ApplicantsList';
import { formatDate } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';

function Field({ label, value }: { label: string, value: unknown }) {
  if (!value) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5 whitespace-pre-line">{display}</dd>
    </div>
  );
}

export default function JobPoolDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const poolId = params.id as string;
  const { toast } = useToast();
  const [pool, setPool] = useState<JobPool | null>(null);
  const [students, setStudents] = useState<StudentApplicant[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const user = demoUser;

  const load = useCallback(async () => {
    setError('');
    try {
      const currentPool = await getJobPool(poolId);
      if (!currentPool) {
        setError('Pool not found.');
        setPool(null);
        setStudents([]);
        return;
      }
      setPool(currentPool);
    } catch {
      const currentPool = getPool(poolId);
      if (!currentPool) {
        setError('Pool not found.');
        setPool(null);
        setStudents([]);
        return;
      }
      setPool(currentPool);
    }
    setStudents(listApplicants(poolId));
  }, [poolId]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status: JobPool['status']) => {
    setBusy(true);
    try {
      if (status === 'archived') {
        await updateJobPoolStatus(poolId, false);
        setPool(prev => prev ? { ...prev, status: 'archived' } : null);
      } else {
        const dbStatus = status === 'active';
        await updateJobPoolStatus(poolId, dbStatus);
        setPool(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      const updatedPool = setPoolStatusMock(poolId, status);
      if (updatedPool) setPool(updatedPool);
    }
    toast({ title: 'Updated', description: `Pool set to ${status}.` });
    setBusy(false);
  };

  const url = pool ? publicPoolUrl(pool.public_slug) : '';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader user={user} hrProfileId={user.id}>
          <Button size="sm" variant="outline" onClick={() => navigate('/job-pools')}>
            <ArrowLeft className="w-4 h-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </AppHeader>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto w-full max-w-4xl space-y-5">
            {error || !pool ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 card-shadow flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Could not load this pool</h3>
                <p className="text-gray-500 mb-6">{error || 'Pool not found.'}</p>
                <Button variant="outline" onClick={() => navigate('/job-pools')}>Back to pools</Button>
              </div>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900">{pool.title}</h2>
                      {pool.company_name && <p className="text-gray-500">{pool.company_name}</p>}
                      <p className="text-xs text-gray-400 mt-1">Created {formatDate(pool.created_at)}</p>
                    </div>
                    <JobPoolStatusBadge status={pool.status} />
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                      Public application link
                    </p>
                    <div className="mt-2">
                      <CopyLinkButton value={url} className="w-full" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pool.status !== 'active' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus('active')} disabled={busy}>
                        <Power className="w-4 h-4 mr-1.5" aria-hidden="true" /> Activate
                      </Button>
                    )}
                    {pool.status !== 'disabled' && pool.status !== 'archived' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus('disabled')} disabled={busy}>
                        <Power className="w-4 h-4 mr-1.5" aria-hidden="true" /> Disable
                      </Button>
                    )}
                    {pool.status !== 'archived' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus('archived')} disabled={busy}>
                        <Archive className="w-4 h-4 mr-1.5" aria-hidden="true" /> Archive
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pool information</h3>
                  <dl className="grid sm:grid-cols-2 gap-4">
                    <Field label="Location" value={pool.location} />
                    <Field label="Contract type" value={pool.contract_type} />
                    <Field label="Experience level" value={pool.experience_level} />
                    <Field label="Education level" value={pool.education_level} />
                    <Field label="Language" value={pool.language} />
                    <Field label="Salary range" value={pool.salary_range} />
                    <Field label="Deadline" value={pool.deadline ? formatDate(pool.deadline) : null} />
                    <Field label="Required skills" value={pool.required_skills} />
                    <div className="sm:col-span-2"><Field label="Main Mission" value={pool.main_mission} /></div>
                    <div className="sm:col-span-2"><Field label="Description" value={pool.description} /></div>
                  </dl>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Applicants ({students.length})
                    </h3>
                  </div>
                  <ApplicantsList students={students} />
                </div>
              </>
            )}
          </div>
        </main>
        <Toaster />
      </div>
    </div>
  );
}
