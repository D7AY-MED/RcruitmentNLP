'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Compass, FileText, Star, MessageSquareText, ArrowRight, UserCircle, Sparkles, BarChart3, Briefcase, Target } from 'lucide-react';
import type { Candidate } from '@/lib/candidateAuth';
import { getActiveOffers } from '@/lib/candidateData';
import { listApplicationsWithStatus, type TrackedApplicationWithStatus } from '@/lib/candidateApplications';
import { PageHeader, GlassCard, CTAButton, Badge, KpiCard } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

function completion(c: Candidate | null): number {
  if (!c) return 0;
  const checks = [
    c.full_name,
    c.phone,
    c.city,
    c.title || c.current_job_title,
    c.current_company,
    c.years_of_experience != null,
    c.education_level,
    c.university_name,
    c.field_of_study,
    c.linkedin_url,
    c.languages && c.languages.length > 0,
    c.expected_salary_min != null,
    c.profile_picture_url,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export default function CandidateDashboardPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const pct = useMemo(() => completion(candidate), [candidate]);

  const [offers, setOffers] = useState<number | null>(null);
  const [apps, setApps] = useState<TrackedApplicationWithStatus[] | null>(null);

  useEffect(() => {
    let alive = true;
    getActiveOffers()
      .then((o) => alive && setOffers(o.length))
      .catch(() => alive && setOffers(0));
    if (candidate?.id) {
      listApplicationsWithStatus(candidate.id)
        .then((a) => alive && setApps(a))
        .catch(() => alive && setApps([]));
    } else {
      setApps([]);
    }
    return () => {
      alive = false;
    };
  }, [candidate?.id]);

  const completedInterviews = apps ? apps.filter((a) => a.status === 'completed').length : null;

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${candidate?.full_name?.split(' ')[0] ?? 'Candidat'} 👋`}
        subtitle="Bienvenue dans votre portail carrière PooLink."
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Offres disponibles" value={offers ?? '—'} icon={Briefcase} tone="blue" />
        <KpiCard label="Mes candidatures" value={apps?.length ?? '—'} icon={FileText} tone="cyan" />
        <KpiCard label="Entretiens passés" value={completedInterviews ?? '—'} icon={MessageSquareText} tone="success" />
        <KpiCard label="Profil complété" value={`${pct}%`} icon={Target} tone="brand" />
      </div>

      {/* Profile completion */}
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="w-5 h-5 text-brand" />
              <h2 className="font-display text-base font-bold text-ink">Complétion du profil</h2>
              <Badge tone={pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'danger'}>{pct}%</Badge>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-grad-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {pct >= 80
                ? 'Excellent ! Votre profil est attractif pour les recruteurs.'
                : 'Complétez votre profil pour augmenter vos chances et obtenir de meilleures recommandations.'}
            </p>
          </div>
          <CTAButton to="/candidate/profile" className="shrink-0">
            <UserCircle className="w-4 h-4" />
            Compléter mon profil
          </CTAButton>
        </div>
      </GlassCard>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PortalCard
          to="/candidate/statistics"
          icon={BarChart3}
          tone="bg-brand-accent-50 text-brand-accent"
          title="Statistiques"
          desc="Votre activité et vos opportunités en un coup d'œil."
          cta="Voir"
        />
        <PortalCard
          to="/candidate/jobs"
          icon={Compass}
          tone="bg-brand-light text-brand"
          title="Découvrir les offres"
          desc="Parcourez les offres actives et postulez en un clic."
          cta="Explorer"
        />
        <PortalCard
          to="/candidate/recommended"
          icon={Star}
          tone="bg-cyan-soft text-cyan"
          title="Offres recommandées"
          desc="Des offres choisies pour vous par l'IA."
          cta="Voir"
        />
        <PortalCard
          to="/candidate/applications"
          icon={FileText}
          tone="bg-brand-accent-50 text-brand-accent"
          title="Mes candidatures"
          desc="Suivez l'avancement de vos candidatures."
          cta="Voir"
        />
        <PortalCard
          to="/candidate/interviews"
          icon={MessageSquareText}
          tone="bg-brand-light text-brand"
          title="Mes entretiens"
          desc="Vos entretiens IA passés et à venir."
          cta="Voir"
        />
        <PortalCard
          to="/candidate/resume"
          icon={FileText}
          tone="bg-cyan-soft text-cyan"
          title="Mon CV"
          desc="Gérez votre CV et votre score de profil."
          cta="Voir"
        />
        <PortalCard
          to="/candidate/insights"
          icon={Sparkles}
          tone="bg-brand-accent-50 text-brand-accent"
          title="Insights carrière"
          desc="Recommandations personnalisées pour progresser."
          cta="Voir"
        />
      </div>
    </div>
  );
}

function PortalCard({
  to,
  icon: Icon,
  tone,
  title,
  desc,
  cta,
}: {
  to: string;
  icon: typeof Compass;
  tone: string;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link to={to}>
      <GlassCard hover className="group p-5 h-full">
        <div className="flex items-start justify-between">
          <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
            <Icon className="w-5 h-5" />
          </span>
        </div>
        <h3 className="mt-3 font-display text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-muted">{desc}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          {cta} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </GlassCard>
    </Link>
  );
}
