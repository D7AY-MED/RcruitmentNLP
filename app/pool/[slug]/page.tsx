'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Banknote, Briefcase, Clock, Globe, GraduationCap, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { getPublicPool } from '@/lib/frontendData';
import { JobPool } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const ACTIVE_KEY = 'xq_active_pool';

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: unknown }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-900">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

export default function PublicJobPoolPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [pool, setPool] = useState<JobPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const currentPool = getPublicPool(slug);
    if (!currentPool) {
      setError({ title: 'Pool not found', message: 'This application link is invalid or has been removed.' });
    }
    setPool(currentPool);
    setLoading(false);
  }, [slug]);

  const apply = useCallback(() => {
    setJoining(true);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ slug, title: pool?.title || '' }));
    toast({ title: 'Application saved', description: 'This frontend-only demo stores the action locally.' });
    setJoining(false);
  }, [slug, pool, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white/60 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2.5">
          <span className="text-xl font-bold text-indigo-600">xQuesty</span>
          <span className="text-sm font-medium text-gray-500">Careers</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" aria-hidden="true" />
            Loading...
          </div>
        ) : error || !pool ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-gray-500" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">{error?.title || 'Pool not found'}</h1>
            <p className="text-sm text-gray-500">{error?.message || 'This application link is unavailable.'}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <p className="text-sm text-gray-500">{pool.company_name || 'Hiring now'}</p>
              <h1 className="text-2xl font-semibold text-gray-900 mt-1">{pool.title}</h1>
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                <InfoRow icon={MapPin} label="Location" value={pool.location} />
                <InfoRow icon={Briefcase} label="Contract" value={pool.contract_type} />
                <InfoRow icon={Clock} label="Experience" value={pool.experience_level} />
                <InfoRow icon={GraduationCap} label="Education" value={pool.education_level} />
                <InfoRow icon={Globe} label="Language" value={pool.language} />
                <InfoRow icon={Banknote} label="Salary" value={pool.salary_range} />
              </div>
              {pool.deadline && (
                <p className="text-xs text-gray-500 mt-3">
                  Apply before {formatDate(pool.deadline)}
                </p>
              )}
            </div>

            {pool.description && (
              <div className="p-6 sm:p-8 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">About the role</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{pool.description}</p>
              </div>
            )}

            {Array.isArray(pool.required_skills) && pool.required_skills.length > 0 && (
              <div className="p-6 sm:p-8 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Required skills</h2>
                <div className="flex flex-wrap gap-2">
                  {pool.required_skills.map((skill) => (
                    <span key={skill} className="text-xs rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-900">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ready to apply?</p>
                  <p className="text-xs text-gray-500">
                    This frontend-only version stores the action locally for preview.
                  </p>
                </div>
                <Button onClick={apply} disabled={joining} className="sm:w-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  {joining ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Apply
                      <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
