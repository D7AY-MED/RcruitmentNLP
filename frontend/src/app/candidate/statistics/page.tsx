'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Target,
  Briefcase,
  FileText,
  MessageSquareText,
  CheckCircle2,
  Star,
  MapPin,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobPool } from '@/lib/types';
import { getCv } from '@/lib/candidateAuth';
import { getActiveOffers, profileCompletion } from '@/lib/candidateData';
import { matchScore } from '@/lib/jobMatch';
import { listApplicationsWithStatus, type TrackedApplicationWithStatus } from '@/lib/candidateApplications';
import { PageHeader, GlassCard, KpiCard, Badge, Button, EmptyState } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

function groupCount(offers: JobPool[], key: 'contract_type' | 'location') {
  const map = new Map<string, number>();
  for (const o of offers) {
    const v = (o[key] || '').toString().trim();
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default function CandidateStatisticsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const navigate = useNavigate();
  const alive = useRef(true);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [offers, setOffers] = useState<JobPool[]>([]);
  const [hasCv, setHasCv] = useState(false);
  const [apps, setApps] = useState<TrackedApplicationWithStatus[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [o, cv, a] = await Promise.all([
        getActiveOffers().catch(() => [] as JobPool[]),
        getCv().catch(() => ({ cv_url: null })),
        candidate?.id ? listApplicationsWithStatus(candidate.id).catch(() => []) : Promise.resolve([]),
      ]);
      if (!alive.current) return;
      setOffers(o);
      setHasCv(!!cv.cv_url);
      setApps(a);
      setStatus('ready');
    } catch {
      if (alive.current) setStatus('error');
    }
  }, [candidate?.id]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const profile = useMemo(() => profileCompletion(candidate), [candidate]);
  const byType = useMemo(() => groupCount(offers, 'contract_type'), [offers]);
  const byLocation = useMemo(() => groupCount(offers, 'location').slice(0, 5), [offers]);
  const recommended = useMemo(() => {
    if (!candidate) return [];
    return offers
      .map((o) => ({ o, score: matchScore(candidate, o) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [candidate, offers]);

  const interviews = apps.filter((a) => a.status !== 'none');
  const completedInterviews = apps.filter((a) => a.status === 'completed').length;
  const recentActivity = [...apps].sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt)).slice(0, 6);
  const maxType = Math.max(1, ...byType.map(([, n]) => n));

  if (status === 'loading') {
    return (
      <div>
        <PageHeader title="Statistiques" subtitle="Votre activité et vos opportunités en un coup d'œil." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="p-5">
              <span className="block skeleton h-3 w-16 mb-3" />
              <span className="block skeleton h-7 w-20" />
            </GlassCard>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <GlassCard key={i} className="p-6">
              <span className="block skeleton h-4 w-40 mb-5" />
              <span className="block skeleton h-32 w-full" />
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div>
        <PageHeader title="Statistiques" />
        <GlassCard className="p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
          <span className="w-12 h-12 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </span>
          <h3 className="font-display text-base font-bold text-ink">Impossible de charger vos statistiques</h3>
          <Button className="mt-2" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={load}>
            Réessayer
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Statistiques" subtitle="Votre activité et vos opportunités en un coup d'œil." />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Profil complété" value={`${profile.pct}%`} icon={Target} tone="brand" />
        <KpiCard label="Offres disponibles" value={offers.length} icon={Briefcase} tone="blue" />
        <KpiCard label="Mes candidatures" value={apps.length} icon={FileText} tone="cyan" />
        <KpiCard label="Entretiens passés" value={completedInterviews} icon={MessageSquareText} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Profile progress */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-ink">Progression du profil</h2>
            <Badge tone={profile.pct >= 80 ? 'success' : profile.pct >= 40 ? 'warning' : 'danger'}>{profile.pct}%</Badge>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden mb-5">
            <div className="h-full rounded-full bg-grad-brand transition-all duration-500" style={{ width: `${profile.pct}%` }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.sections.map((s) => (
              <div key={s.title}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink">{s.title}</span>
                  <span className="font-mono text-xs text-muted">{s.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-grad-brand" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {profile.missing.length > 0 && (
            <p className="mt-5 text-xs text-muted">
              <Lightbulb className="inline w-3.5 h-3.5 text-brand mr-1" />
              À compléter : {profile.missing.slice(0, 4).map((m) => m.label).join(', ')}
              {profile.missing.length > 4 ? '…' : ''}{' '}
              <Link to="/candidate/profile" className="text-brand font-semibold">Compléter</Link>
            </p>
          )}
        </GlassCard>

        {/* CV status */}
        <GlassCard className="p-6 flex flex-col">
          <h2 className="font-display text-base font-bold text-ink mb-4">CV</h2>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-3',
                hasCv ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted',
              )}
            >
              {hasCv ? <CheckCircle2 className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
            </span>
            <p className="text-sm font-semibold text-ink">{hasCv ? 'CV importé' : 'Aucun CV importé'}</p>
            <p className="mt-1 text-xs text-muted">
              {hasCv ? 'Votre CV est prêt pour vos candidatures.' : 'Importez votre CV pour postuler plus vite.'}
            </p>
            <Button
              variant={hasCv ? 'outline' : 'primary'}
              size="sm"
              className="mt-4"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              onClick={() => navigate('/candidate/resume')}
            >
              {hasCv ? 'Gérer mon CV' : 'Importer un CV'}
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Offers by type */}
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-5">Offres par type de contrat</h2>
          {byType.length === 0 ? (
            <EmptyState icon={Briefcase} title="Aucune donnée" description="Aucune offre active pour le moment." className="py-8" />
          ) : (
            <div className="space-y-3">
              {byType.map(([type, n]) => (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink">{type}</span>
                    <span className="font-mono text-xs text-muted">{n}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-grad-brand" style={{ width: `${(n / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Offers by location */}
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-5">Top localisations</h2>
          {byLocation.length === 0 ? (
            <EmptyState icon={MapPin} title="Aucune donnée" description="Localisation non renseignée sur les offres." className="py-8" />
          ) : (
            <ul className="space-y-2.5">
              {byLocation.map(([loc, n]) => (
                <li key={loc} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-sm text-ink truncate">{loc}</span>
                  <Badge tone="blue">{n} offre{n > 1 ? 's' : ''}</Badge>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recommended */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-ink">Offres recommandées</h2>
            <Link to="/candidate/recommended" className="text-sm font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recommended.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Aucune recommandation"
              description="Complétez votre profil pour obtenir des recommandations."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-border-brand">
              {recommended.map(({ o, score }) => (
                <li key={o.id}>
                  <button type="button" onClick={() => navigate(`/apply/${o.public_slug}`)} className="w-full flex items-center gap-3 py-3 text-left group">
                    <span className="w-9 h-9 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate group-hover:text-brand transition-colors">{o.title}</span>
                      {o.company_name && <span className="block text-xs text-muted truncate">{o.company_name}</span>}
                    </span>
                    <Badge tone={score >= 60 ? 'success' : score >= 30 ? 'cyan' : 'neutral'}>{score}%</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Recent activity */}
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-4">Activité récente</h2>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune activité"
              description="Postulez à une offre pour voir votre activité ici."
              className="py-8"
            />
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a.poolId} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-surface-2 text-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink truncate">Candidature — {a.title}</span>
                    <span className="block text-xs text-muted">{new Date(a.appliedAt).toLocaleDateString('fr-FR')}</span>
                  </span>
                  <Badge tone={a.status === 'completed' ? 'success' : a.status === 'active' ? 'warning' : 'neutral'} dot>
                    {a.status === 'completed' ? 'Terminé' : a.status === 'active' ? 'En cours' : 'Enregistré'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {interviews.length === 0 && apps.length === 0 && (
        <p className="mt-6 text-xs text-muted">
          Astuce : <Link to="/candidate/jobs" className="text-brand font-semibold">découvrez des offres</Link> et postulez pour enrichir vos statistiques.
        </p>
      )}
    </div>
  );
}
