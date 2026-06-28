'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Sparkles, Users, ArrowRight, Search, PlusCircle, FileText } from 'lucide-react';
import { listJobPools, listSearchHistory } from '@/lib/jobPoolService';
import type { JobPool, SearchHistoryItem } from '@/lib/types';
import { useRecruiter } from '@/lib/recruiter-context';
import { KpiCard, GlassCard, Badge, PageHeader, CTAButton, LoadingState } from '@/shared/components';

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  disabled: 'warning',
  archived: 'neutral',
};

export default function RecruiterDashboardPage() {
  const user = useRecruiter();
  const [pools, setPools] = useState<JobPool[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, h] = await Promise.all([listJobPools().catch(() => []), listSearchHistory().catch(() => [])]);
        setPools(Array.isArray(p) ? p : []);
        setHistory(Array.isArray(h) ? h : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    const active = pools.filter((p) => p.status === 'active').length;
    const evaluated = history.reduce((n, h) => n + (Number((h as { topCount?: number }).topCount) || 0), 0);
    return { created: pools.length, active, searches: history.length, evaluated };
  }, [pools, history]);

  const recentPools = useMemo(
    () => [...pools].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [pools],
  );

  const activity = useMemo(() => {
    const ev = [
      ...pools.map((p) => ({ when: p.created_at, text: `Offre créée — ${p.title}`, icon: Briefcase })),
      ...history.map((h) => ({
        when: (h as { createdAt?: string }).createdAt ?? '',
        text: `Recherche IA — ${(h as { pool_title?: string }).pool_title ?? 'candidats'}`,
        icon: Sparkles,
      })),
    ].filter((e) => e.when);
    return ev.sort((a, b) => +new Date(b.when) - +new Date(a.when)).slice(0, 6);
  }, [pools, history]);

  if (loading) return <LoadingState label="Chargement de votre tableau de bord…" />;

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.fullName?.split(' ')[0] ?? 'Recruteur'} 👋`}
        subtitle="Voici un aperçu de votre activité de recrutement."
        actions={
          <CTAButton to="/recruiter/jobs/new" size="sm">
            <PlusCircle className="w-4 h-4" />
            Créer une offre
          </CTAButton>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Offres créées" value={kpis.created} icon={Briefcase} tone="brand" />
        <KpiCard label="Offres actives" value={kpis.active} icon={CheckCircle2} tone="success" />
        <KpiCard label="Recherches IA" value={kpis.searches} icon={Sparkles} tone="cyan" />
        <KpiCard label="Candidats évalués" value={kpis.evaluated} icon={Users} tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent jobs */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-ink">Offres récentes</h2>
            <Link to="/recruiter/jobs" className="text-sm font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentPools.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">
              Aucune offre pour l'instant.{' '}
              <Link to="/recruiter/jobs/new" className="text-brand font-semibold">Créez-en une</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-border-brand">
              {recentPools.map((p) => (
                <li key={p.id}>
                  <Link to={`/recruiter/jobs/${p.id}`} className="flex items-center gap-3 py-3 group">
                    <span className="w-9 h-9 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{p.title}</span>
                      {p.company_name && <span className="block text-xs text-muted truncate">{p.company_name}</span>}
                    </span>
                    <Badge tone={STATUS_TONE[p.status] ?? 'neutral'} dot>{p.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Quick actions + activity */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="font-display text-base font-bold text-ink mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <QuickLink to="/recruiter/jobs/new" icon={PlusCircle} label="Créer une offre" />
              <QuickLink to="/recruiter/candidates" icon={Search} label="Rechercher des candidats" />
              <QuickLink to="/recruiter/applications" icon={FileText} label="Voir les candidatures" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-display text-base font-bold text-ink mb-4">Activité récente</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted">Aucune activité récente.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((e, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface-2 text-muted flex items-center justify-center shrink-0 mt-0.5">
                      <e.icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-ink truncate">{e.text}</span>
                      <span className="block text-xs text-muted">{new Date(e.when).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Briefcase; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 h-11 text-sm font-medium text-ink hover:bg-surface-2 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="w-4 h-4 text-muted" />
    </Link>
  );
}
