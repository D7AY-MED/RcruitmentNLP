'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { listJobPools, listSearchHistory } from '@/lib/jobPoolService';
import type { JobPool, SearchHistoryItem } from '@/lib/types';
import { PageHeader, GlassCard, KpiCard, LoadingState, EmptyState } from '@/shared/components';

const STATUS_BAR: Record<string, string> = {
  active: 'bg-success',
  disabled: 'bg-warning',
  archived: 'bg-surface-2',
};

/** Recruiter analytics — derived entirely from existing pools + search history. */
export default function RecruiterAnalyticsPage() {
  const [pools, setPools] = useState<JobPool[] | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    (async () => {
      const [p, h] = await Promise.all([
        listJobPools().catch(() => []),
        listSearchHistory().catch(() => []),
      ]);
      setPools(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
    })();
  }, []);

  const data = useMemo(() => {
    const list = pools ?? [];
    const byStatus = { active: 0, disabled: 0, archived: 0 } as Record<string, number>;
    for (const p of list) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    const evaluated = history.reduce((n, h) => n + (Number((h as { topCount?: number }).topCount) || 0), 0);
    const recent = history.slice(0, 8).reverse();
    const maxTop = Math.max(1, ...recent.map((h) => Number((h as { topCount?: number }).topCount) || 0));
    return { total: list.length, byStatus, evaluated, recent, maxTop };
  }, [pools, history]);

  if (pools === null) return <LoadingState label="Calcul de vos statistiques…" />;

  return (
    <div>
      <PageHeader title="Analytique" subtitle="Vos indicateurs de recrutement, en temps réel." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Offres créées" value={data.total} icon={Briefcase} tone="brand" />
        <KpiCard label="Offres actives" value={data.byStatus.active ?? 0} icon={CheckCircle2} tone="success" />
        <KpiCard label="Recherches IA" value={history.length} icon={Sparkles} tone="cyan" />
        <KpiCard label="Candidats évalués" value={data.evaluated} icon={Users} tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-5">Répartition des offres</h2>
          {data.total === 0 ? (
            <p className="text-sm text-muted">Aucune offre à analyser.</p>
          ) : (
            <div className="space-y-4">
              {(['active', 'disabled', 'archived'] as const).map((st) => {
                const n = data.byStatus[st] ?? 0;
                const pct = Math.round((n / data.total) * 100);
                return (
                  <div key={st}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-ink">{st}</span>
                      <span className="font-mono text-xs text-muted">{n} · {pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_BAR[st]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-5">Candidats évalués par recherche</h2>
          {data.recent.length === 0 ? (
            <EmptyState title="Aucune recherche pour le moment" description="Lancez une recherche IA pour voir vos statistiques." className="py-8" />
          ) : (
            <div className="flex items-end gap-2 h-40">
              {data.recent.map((h, i) => {
                const v = Number((h as { topCount?: number }).topCount) || 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5" title={`${v} candidats`}>
                    <div className="w-full rounded-t-md bg-grad-brand" style={{ height: `${(v / data.maxTop) * 100}%`, minHeight: 4 }} />
                    <span className="font-mono text-[10px] text-muted">{v}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
