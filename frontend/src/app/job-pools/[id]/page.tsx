'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Archive, ArrowLeft, Power, Loader2, User, Briefcase, Sparkles, MessageSquare, CheckCircle2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { demoUser, getPool, publicPoolUrl, setPoolStatus as setPoolStatusMock } from '@/lib/frontendData';
import { getJobPool, updateJobPoolStatus, listPoolApplications, getPoolApplication } from '@/lib/jobPoolService';
import { JobPool } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import JobPoolStatusBadge from '@/components/job-pools/JobPoolStatusBadge';
import CopyLinkButton from '@/components/job-pools/CopyLinkButton';

function safeFormatDate(dateString: any): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

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
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const user = demoUser;

  // Drawer state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const currentPool = await getJobPool(poolId);
      if (!currentPool) {
        setError('Pool not found.');
        setPool(null);
        setApplications([]);
        setLoading(false);
        return;
      }
      setPool(currentPool);

      const apps = await listPoolApplications(poolId);
      setApplications(apps);
    } catch {
      const currentPool = getPool(poolId);
      if (!currentPool) {
        setError('Pool not found.');
        setPool(null);
        setApplications([]);
        setLoading(false);
        return;
      }
      setPool(currentPool);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedSessionId) {
      setDrawerData(null);
      return;
    }
    setDrawerLoading(true);
    setDrawerError('');
    getPoolApplication(poolId, selectedSessionId)
      .then(setDrawerData)
      .catch((err) => setDrawerError(err.message || 'Failed to load details.'))
      .finally(() => setDrawerLoading(false));
  }, [selectedSessionId, poolId]);

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
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 card-shadow flex flex-col items-center text-center justify-center min-h-[300px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-medium text-gray-500">Loading pool details...</p>
              </div>
            ) : error || !pool ? (
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

                 <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Applicants ({applications.length})
                    </h3>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">No applications recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Score AI</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Updated</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {applications.map((app) => {
                            const avatarInitials = initials(app.candidate_name || app.phone || 'Candidate');
                            const progressPct = app.total_questions ? Math.round((app.answered / app.total_questions) * 100) : 0;
                            
                            return (
                              <tr 
                                key={app.session_id} 
                                onClick={() => { setSelectedSessionId(app.session_id); setDrawerOpen(true); }}
                                className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xs shrink-0">
                                      {avatarInitials}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{app.candidate_name || 'Candidate'}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{app.phone || '—'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {app.score ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {app.score}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                                      <div className="h-full rounded-full bg-indigo-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">{app.answered}/{app.total_questions}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                                    app.status === 'completed'
                                      ? 'bg-green-50 text-green-700 border-green-200/60'
                                      : 'bg-amber-50 text-amber-700 border-amber-200/60'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'completed' ? 'bg-green-600' : 'bg-amber-600'}`} />
                                    {app.status === 'completed' ? 'Completed' : 'In progress'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                  {safeFormatDate(app.updated_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
        <Toaster />
      </div>

      {/* ---------- DETAIL DRAWER ---------- */}
      <div className={`fixed inset-0 z-50 overflow-hidden ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop overlay */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={() => { setDrawerOpen(false); setSelectedSessionId(null); }}
        />
        
        {/* Drawer Panel */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div 
            className={`w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {drawerLoading ? 'Chargement...' : drawerData?.candidate_name || 'Détails du candidat'}
                </h3>
                {drawerData && (
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                      drawerData.status === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {drawerData.status === 'completed' ? 'Terminé' : 'En cours'}
                    </span>
                    <span>{drawerData.answered}/{drawerData.total_questions} questions répondues</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => { setDrawerOpen(false); setSelectedSessionId(null); }}
                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-sm font-medium">Chargement des données du candidat...</p>
                </div>
              ) : drawerError ? (
                <div className="text-center py-20 bg-rose-50/50 border border-rose-100 rounded-2xl p-6">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-rose-900">{drawerError}</p>
                </div>
              ) : drawerData ? (
                <div className="space-y-6">
                  {/* Context Info Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="p-4 rounded-xl border border-gray-150 bg-white">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <User className="h-3.5 w-3.5" /> Candidat
                      </p>
                      <p className="mt-1 font-bold text-gray-900">{drawerData.candidate_name || '—'}</p>
                      {drawerData.candidate?.email && <p className="text-xs text-gray-500">{drawerData.candidate.email}</p>}
                      {drawerData.candidate?.phone && <p className="text-xs text-gray-500">{drawerData.candidate.phone}</p>}
                    </div>
                    <div className="p-4 rounded-xl border border-gray-150 bg-white">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Briefcase className="h-3.5 w-3.5" /> Offre
                      </p>
                      <p className="mt-1 font-bold text-gray-900">{drawerData.pool_title || '—'}</p>
                      {drawerData.pool?.company_name && <p className="text-xs text-gray-500">{drawerData.pool.company_name}</p>}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>Progression de l'entretien</span>
                      <span>{drawerData.total_questions ? Math.round((drawerData.answered / drawerData.total_questions) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div 
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: `${drawerData.total_questions ? Math.round((drawerData.answered / drawerData.total_questions) * 100) : 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* AI Summary Section */}
                  {drawerData.summary && (drawerData.summary.summary || drawerData.summary.score) && (
                    <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-indigo-950">
                          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                          Résumé IA
                        </p>
                        {drawerData.summary.score && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-sm">
                            Score Match: {drawerData.summary.score}
                          </span>
                        )}
                      </div>
                      {drawerData.summary.summary && (
                        <p className="whitespace-pre-wrap text-sm text-indigo-900/90 leading-relaxed font-normal">
                          {drawerData.summary.summary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Transcript Section */}
                  <section>
                    <h3 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <MessageSquare className="h-3.5 w-3.5" /> Transcription de l'entretien
                    </h3>
                    {!drawerData.questions || !drawerData.questions.length ? (
                      <p className="text-sm text-gray-400 italic">Aucune question enregistrée.</p>
                    ) : (
                      <ol className="space-y-4">
                        {drawerData.questions.map((q: any, i: number) => (
                          <li key={q.sequence ?? i} className="rounded-2xl border border-gray-150 p-4 hover:border-gray-300 transition-all">
                            <p className="text-sm font-bold text-gray-900">
                              <span className="mr-2 text-indigo-600">Q{q.sequence ?? i + 1}.</span>
                              {q.question}
                            </p>
                            <p className="mt-2.5 whitespace-pre-wrap text-sm text-gray-600 leading-relaxed border-l-2 border-slate-150 pl-3">
                              {q.answer ? q.answer : <span className="italic text-gray-400">Aucune réponse pour le moment</span>}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
