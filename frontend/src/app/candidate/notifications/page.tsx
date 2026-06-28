'use client';

import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { listApplicationsWithStatus, type TrackedApplicationWithStatus } from '@/lib/candidateApplications';
import { PageHeader, GlassCard, LoadingState, EmptyState } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

export default function CandidateNotificationsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const [apps, setApps] = useState<TrackedApplicationWithStatus[] | null>(null);

  useEffect(() => {
    if (!candidate?.id) {
      setApps([]);
      return;
    }
    listApplicationsWithStatus(candidate.id).then(setApps).catch(() => setApps([]));
  }, [candidate?.id]);

  if (apps === null) return <LoadingState label="Chargement…" />;

  // Derive notifications from real interview statuses.
  const items = apps
    .filter((a) => a.status !== 'none')
    .map((a) => ({
      key: a.poolId,
      done: a.status === 'completed',
      text:
        a.status === 'completed'
          ? `Votre entretien pour « ${a.title} » est terminé.`
          : `Entretien en cours pour « ${a.title} » — pensez à le finaliser.`,
      when: a.appliedAt,
    }));

  return (
    <div>
      <PageHeader title="Notifications" subtitle="L'activité liée à vos candidatures." />
      {items.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={Bell}
            title="Aucune notification pour le moment"
            description="Postulez à une offre : le suivi de vos entretiens apparaîtra ici."
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-2">
          <ul className="divide-y divide-border-brand">
            {items.map((n) => (
              <li key={n.key} className="flex items-start gap-3 p-4">
                <span
                  className={
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
                    (n.done ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')
                  }
                >
                  {n.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{n.text}</span>
                  <span className="block text-xs text-muted">{new Date(n.when).toLocaleDateString('fr-FR')}</span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
