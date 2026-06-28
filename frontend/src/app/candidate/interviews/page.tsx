'use client';

import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { MessageSquareText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { listApplicationsWithStatus, type TrackedApplicationWithStatus } from '@/lib/candidateApplications';
import { PageHeader, GlassCard, Badge, LoadingState, EmptyState, CTAButton } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';
import { STATUS_META } from '../applications/page';

export default function CandidateInterviewsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const [apps, setApps] = useState<TrackedApplicationWithStatus[] | null>(null);

  useEffect(() => {
    if (!candidate?.id) {
      setApps([]);
      return;
    }
    listApplicationsWithStatus(candidate.id).then(setApps).catch(() => setApps([]));
  }, [candidate?.id]);

  if (apps === null) return <LoadingState label="Chargement de vos entretiens…" />;

  // Only items where an interview actually exists (started or completed).
  const interviews = apps.filter((a) => a.status !== 'none');

  return (
    <div>
      <PageHeader title="Mes entretiens" subtitle="Vos entretiens IA passés et en cours." />
      {interviews.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={MessageSquareText}
            title="Aucun entretien pour le moment"
            description="Postulez à une offre puis passez l'entretien IA pour le retrouver ici."
            action={<CTAButton to="/candidate/jobs" size="sm">Découvrir des offres</CTAButton>}
          />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {interviews.map((a) => {
            const s = STATUS_META[a.status];
            const done = a.status === 'completed';
            return (
              <GlassCard key={a.poolId} className="p-4 flex items-center gap-4">
                <span
                  className={
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' +
                    (done ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')
                  }
                >
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <MessageSquareText className="w-5 h-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{a.title}</p>
                  {a.company && <p className="text-xs text-muted truncate">{a.company}</p>}
                </div>
                <Badge tone={s.tone} dot>{s.label}</Badge>
                {!done && (
                  <Link
                    to={`/apply/interview/${a.token}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand shrink-0"
                  >
                    Reprendre <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
