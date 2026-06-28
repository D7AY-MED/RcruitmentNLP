'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Sparkles, Bell } from 'lucide-react';
import { listJobPools, listSearchHistory } from '@/lib/jobPoolService';
import type { JobPool, SearchHistoryItem } from '@/lib/types';
import { PageHeader, GlassCard, LoadingState, EmptyState } from '@/shared/components';

/** Recruiter notifications — a real activity feed derived from pools + searches. */
export default function RecruiterNotificationsPage() {
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

  const events = useMemo(() => {
    const ev = [
      ...(pools ?? []).map((p) => ({
        icon: Briefcase,
        text: `Offre « ${p.title} » créée`,
        when: p.created_at,
      })),
      ...history.map((h) => ({
        icon: Sparkles,
        text: `Recherche IA — ${(h as { topCount?: number }).topCount ?? 0} candidats pour « ${(h as { pool_title?: string }).pool_title ?? 'une offre'} »`,
        when: (h as { createdAt?: string }).createdAt ?? '',
      })),
    ].filter((e) => e.when);
    ev.sort((a, b) => +new Date(b.when) - +new Date(a.when));
    return ev.slice(0, 30);
  }, [pools, history]);

  if (pools === null) return <LoadingState label="Chargement…" />;

  return (
    <div>
      <PageHeader title="Notifications" subtitle="L'activité récente de votre espace recruteur." />
      {events.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={Bell}
            title="Aucune activité pour le moment"
            description="Créez une offre ou lancez une recherche : votre activité apparaîtra ici."
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-2">
          <ul className="divide-y divide-border-brand">
            {events.map((e, i) => (
              <li key={i} className="flex items-start gap-3 p-4">
                <span className="w-9 h-9 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                  <e.icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{e.text}</span>
                  <span className="block text-xs text-muted">{new Date(e.when).toLocaleDateString('fr-FR')}</span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
