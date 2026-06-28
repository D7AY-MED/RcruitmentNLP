'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { FileText, ArrowRight, Building2 } from 'lucide-react';
import {
  listApplicationsWithStatus,
  type TrackedApplicationWithStatus,
  type ApplicationStatus,
} from '@/lib/candidateApplications';
import { PageHeader, GlassCard, Badge, SearchInput, LoadingState, EmptyState, CTAButton } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

export const STATUS_META: Record<ApplicationStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  completed: { label: 'Entretien terminé', tone: 'success' },
  active: { label: 'Entretien en cours', tone: 'warning' },
  none: { label: 'À poursuivre', tone: 'neutral' },
};

export default function CandidateApplicationsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const [apps, setApps] = useState<TrackedApplicationWithStatus[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!candidate?.id) {
      setApps([]);
      return;
    }
    listApplicationsWithStatus(candidate.id).then(setApps).catch(() => setApps([]));
  }, [candidate?.id]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    const t = q.trim().toLowerCase();
    if (!t) return apps;
    return apps.filter((a) => a.title.toLowerCase().includes(t) || (a.company || '').toLowerCase().includes(t));
  }, [apps, q]);

  if (apps === null) return <LoadingState label="Chargement de vos candidatures…" />;

  return (
    <div>
      <PageHeader title="Mes candidatures" subtitle="Suivez l'avancement de vos candidatures." />
      {apps.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={FileText}
            title="Aucune candidature pour le moment"
            description="Postulez à une offre pour voir le suivi ici."
            action={<CTAButton to="/candidate/jobs" size="sm">Découvrir des offres</CTAButton>}
          />
        </GlassCard>
      ) : (
        <>
          <div className="mb-5 max-w-md">
            <SearchInput value={q} onChange={setQ} onClear={() => setQ('')} placeholder="Rechercher par poste ou entreprise…" />
          </div>
          {filtered.length === 0 ? (
            <GlassCard className="p-2">
              <EmptyState icon={FileText} title="Aucun résultat" description="Essayez un autre mot-clé." />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((a) => {
            const s = STATUS_META[a.status];
            return (
              <GlassCard key={a.poolId} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <Badge tone={s.tone} dot>{s.label}</Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-ink truncate">{a.title}</h3>
                {a.company && <p className="text-sm text-muted truncate">{a.company}</p>}
                <p className="mt-1 text-xs text-muted">
                  Postulé le {new Date(a.appliedAt).toLocaleDateString('fr-FR')}
                </p>
                {a.status !== 'completed' && (
                  <Link
                    to={`/apply/interview/${a.token}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
                  >
                    {a.status === 'active' ? "Reprendre l'entretien" : "Démarrer l'entretien"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </GlassCard>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
