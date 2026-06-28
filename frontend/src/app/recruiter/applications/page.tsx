'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight } from 'lucide-react';
import { listJobPools } from '@/lib/jobPoolService';
import type { JobPool } from '@/lib/types';
import { PageHeader, GlassCard, Badge, LoadingState, EmptyState, CTAButton } from '@/shared/components';

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  disabled: 'warning',
  archived: 'neutral',
};

/**
 * Candidatures — aggregated by offer. Each offer opens its applicants table
 * (existing pool detail). A unified cross-offer feed will follow once a
 * dedicated backend endpoint exists.
 */
export default function RecruiterApplicationsPage() {
  const [pools, setPools] = useState<JobPool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobPools()
      .then((p) => setPools(Array.isArray(p) ? p : []))
      .catch(() => setPools([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Chargement des candidatures…" />;

  return (
    <div>
      <PageHeader title="Candidatures" subtitle="Suivez les candidatures par offre." />
      {pools.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={Briefcase}
            title="Aucune offre pour le moment"
            description="Créez une offre pour commencer à recevoir des candidatures."
            action={<CTAButton to="/recruiter/jobs/new" size="sm">Créer une offre</CTAButton>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pools.map((p) => (
            <Link key={p.id} to={`/recruiter/jobs/${p.id}`}>
              <GlassCard hover className="p-5 h-full">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <Badge tone={STATUS_TONE[p.status] ?? 'neutral'} dot>{p.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-ink truncate">{p.title}</h3>
                {p.company_name && <p className="text-sm text-muted truncate">{p.company_name}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Voir les candidatures <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
