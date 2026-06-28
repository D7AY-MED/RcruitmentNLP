'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getCurrentCandidate } from '@/lib/candidateAuth';
import { getPublicJobPool } from '@/lib/jobPoolService';
import { getPublicPool as getPublicPoolMock } from '@/lib/frontendData';
import { JobPool } from '@/lib/types';
import { recordApplication } from '@/lib/candidateApplications';
import InterviewView from '@/interview/components/InterviewView';

export default function InterviewTokenPage() {
  const params = useParams();
  const token = params.token as string;

  const [checking, setChecking] = useState(true);
  const [pool, setPool] = useState<JobPool | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCurrentCandidate()
      .then(async (cand) => {
        const track = (p: JobPool | null) => {
          if (p && cand?.id) {
            recordApplication(cand.id, {
              poolId: p.id,
              token,
              title: p.title,
              company: p.company_name || undefined,
              appliedAt: new Date().toISOString(),
            });
          }
        };
        try {
          const currentPool = await getPublicJobPool(token);
          if (currentPool) {
            setPool(currentPool);
            track(currentPool);
          } else {
            const mockPool = getPublicPoolMock(token);
            if (mockPool) {
              setPool(mockPool);
            } else {
              setError(true);
            }
          }
        } catch {
          const mockPool = getPublicPoolMock(token);
          if (mockPool) {
            setPool(mockPool);
          } else {
            setError(true);
          }
        }
        setChecking(false);
      })
      .catch(() => {
        setError(true);
        setChecking(false);
      });
  }, [token]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light/35 dark:bg-bg text-gray-500 dark:text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand mr-2" />
        Vérification...
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-bg flex items-center justify-center p-4">
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-brand rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-950 dark:text-ink mb-2">Offre introuvable</h1>
          <p className="text-sm text-gray-600 dark:text-ink">Ce lien de candidature est invalide ou a été retiré.</p>
        </div>
      </div>
    );
  }

  const maxQuestions = parseInt(import.meta.env.VITE_TOTAL_QUESTIONS || '15', 10);

  return (
    <InterviewView
      jobTitle={pool.title}
      companyName={pool.company_name || 'Entreprise Confidentielle'}
      poolId={pool.id}
      maxQuestions={maxQuestions}
    />
  );
}
