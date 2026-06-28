'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, ArrowRight } from 'lucide-react';
import { listJobPools, listPoolApplications } from '@/lib/jobPoolService';
import type { JobPool } from '@/lib/types';
import { PageHeader, GlassCard, Badge, LoadingState, EmptyState, CTAButton } from '@/shared/components';

type Row = {
  session_id: string;
  poolId: string;
  poolTitle: string;
  candidate_name?: string;
  phone?: string;
  score?: number | string;
  answered?: number;
  total_questions?: number;
  status?: string;
  updated_at?: string;
};

/** All interview sessions across the recruiter's pools — real aggregated data. */
export default function RecruiterInterviewsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pools: JobPool[] = await listJobPools().catch(() => []);
        const per = await Promise.all(
          pools.map(async (p) => {
            const apps = await listPoolApplications(p.id).catch(() => []);
            return (Array.isArray(apps) ? apps : []).map((a: Record<string, unknown>) => ({
              ...(a as object),
              poolId: p.id,
              poolTitle: p.title,
            })) as Row[];
          }),
        );
        const flat = per.flat();
        flat.sort((a, b) => +new Date(b.updated_at || 0) - +new Date(a.updated_at || 0));
        setRows(flat);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null) return <LoadingState label="Chargement des entretiens…" />;

  return (
    <div>
      <PageHeader title="Entretiens" subtitle="Tous les entretiens IA de vos offres." />
      {rows.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={MessageSquareText}
            title="Aucun entretien pour le moment"
            description="Dès qu'un candidat passe un entretien sur l'une de vos offres, il apparaît ici."
            action={<CTAButton to="/recruiter/jobs" size="sm">Voir mes offres</CTAButton>}
          />
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border-brand text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-semibold">Candidat</th>
                  <th className="px-5 py-3 font-semibold">Offre</th>
                  <th className="px-5 py-3 font-semibold">Progression</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold text-right">Score</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = r.total_questions ? Math.round(((r.answered ?? 0) / r.total_questions) * 100) : 0;
                  const done = r.status === 'completed';
                  return (
                    <tr key={r.session_id} className="border-b border-border-brand last:border-0 hover:bg-surface-2/60">
                      <td className="px-5 py-3 font-medium text-ink">{r.candidate_name || 'Candidat'}</td>
                      <td className="px-5 py-3 text-muted">{r.poolTitle}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-surface-2 overflow-hidden">
                            <div className="h-full rounded-full bg-grad-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-xs text-muted">{r.answered ?? 0}/{r.total_questions ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={done ? 'success' : 'warning'} dot>{done ? 'Terminé' : 'En cours'}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-brand">{r.score ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/recruiter/jobs/${r.poolId}`} className="inline-flex items-center gap-1 text-brand font-semibold">
                          Voir <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
