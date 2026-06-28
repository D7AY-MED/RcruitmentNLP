'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Power, ArrowRight } from 'lucide-react';
import { listJobPools, updateJobPoolStatus } from '@/lib/jobPoolService';
import type { JobPool } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader, GlassCard, Badge, Button, LoadingState, EmptyState, CTAButton } from '@/shared/components';

/** Brouillons = offers that are not live (disabled/archived). Real data. */
export default function RecruiterDraftsPage() {
  const { toast } = useToast();
  const [pools, setPools] = useState<JobPool[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    listJobPools()
      .then((p) => setPools(Array.isArray(p) ? p : []))
      .catch(() => setPools([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const activate = async (pool: JobPool) => {
    setBusyId(pool.id);
    try {
      await updateJobPoolStatus(pool.id, true);
      toast({ title: 'Offre activée', description: `« ${pool.title} » est maintenant en ligne.` });
      load();
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'activer l'offre." });
    } finally {
      setBusyId(null);
    }
  };

  if (pools === null) return <LoadingState label="Chargement…" />;
  const inactive = pools.filter((p) => p.status !== 'active');

  return (
    <div>
      <PageHeader title="Brouillons & offres inactives" subtitle="Vos offres non publiées ou archivées." />
      {inactive.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={Briefcase}
            title="Toutes vos offres sont actives"
            description="Créez une nouvelle offre ou désactivez-en une pour la retrouver ici."
            action={<CTAButton to="/recruiter/jobs/new" size="sm">Créer une offre</CTAButton>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inactive.map((p) => (
            <GlassCard key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="w-10 h-10 rounded-xl bg-surface-2 text-muted flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </span>
                <Badge tone={p.status === 'archived' ? 'neutral' : 'warning'} dot>{p.status}</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-ink truncate">{p.title}</h3>
              {p.company_name && <p className="text-sm text-muted truncate">{p.company_name}</p>}
              <div className="mt-4 flex items-center justify-between">
                <Button size="sm" loading={busyId === p.id} leftIcon={<Power className="w-4 h-4" />} onClick={() => activate(p)}>
                  Activer
                </Button>
                <Link to={`/recruiter/jobs/${p.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Détails <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
