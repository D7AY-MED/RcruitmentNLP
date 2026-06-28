'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Lightbulb, Target, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { getActiveOffers } from '@/lib/candidateData';
import type { JobPool } from '@/lib/types';
import type { Candidate } from '@/lib/candidateAuth';
import { matchScore } from '@/lib/jobMatch';
import { PageHeader, GlassCard, KpiCard, LoadingState, CTAButton } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

const SECTIONS: { title: string; fields: (keyof Candidate)[] }[] = [
  { title: 'Identité', fields: ['full_name', 'phone', 'city', 'linkedin_url'] },
  { title: 'Professionnel', fields: ['current_job_title', 'current_company', 'years_of_experience', 'title'] },
  { title: 'Formation', fields: ['education_level', 'university_name', 'field_of_study'] },
  { title: 'Préférences', fields: ['languages', 'expected_salary_min'] },
];

const LABELS: Partial<Record<keyof Candidate, string>> = {
  full_name: 'Nom complet',
  phone: 'Téléphone',
  city: 'Ville',
  linkedin_url: 'LinkedIn',
  current_job_title: 'Poste actuel',
  current_company: 'Entreprise actuelle',
  years_of_experience: "Années d'expérience",
  title: 'Titre / accroche',
  education_level: "Niveau d'études",
  university_name: 'Université',
  field_of_study: "Domaine d'études",
  languages: 'Langues',
  expected_salary_min: 'Salaire souhaité',
};

function filled(c: Candidate, f: keyof Candidate): boolean {
  const v = c[f];
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && v !== '';
}

export default function CandidateInsightsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const [pools, setPools] = useState<JobPool[] | null>(null);

  useEffect(() => {
    getActiveOffers()
      .then(setPools)
      .catch(() => setPools([]));
  }, []);

  const stats = useMemo(() => {
    if (!candidate) return null;
    const all = SECTIONS.flatMap((s) => s.fields);
    const done = all.filter((f) => filled(candidate, f)).length;
    const pct = Math.round((done / all.length) * 100);
    const missing = all.filter((f) => !filled(candidate, f));
    const strong = pools ? pools.filter((p) => matchScore(candidate, p) >= 40).length : 0;
    return { pct, done, total: all.length, missing, strong };
  }, [candidate, pools]);

  if (!candidate || pools === null || !stats) return <LoadingState label="Analyse de votre profil…" />;

  return (
    <div>
      <PageHeader title="Insights carrière" subtitle="Analyse de votre profil et opportunités." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Profil complété" value={`${stats.pct}%`} icon={Target} tone="brand" />
        <KpiCard label="Champs renseignés" value={`${stats.done}/${stats.total}`} icon={CheckCircle2} tone="success" />
        <KpiCard label="Offres compatibles" value={stats.strong} icon={Sparkles} tone="cyan" hint="match ≥ 40%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-4">Force du profil par section</h2>
          <div className="space-y-4">
            {SECTIONS.map((s) => {
              const d = s.fields.filter((f) => filled(candidate, f)).length;
              const p = Math.round((d / s.fields.length) * 100);
              return (
                <div key={s.title}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink">{s.title}</span>
                    <span className="font-mono text-xs text-muted">{p}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-grad-brand" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-brand" /> Suggestions pour progresser
          </h2>
          {stats.missing.length === 0 ? (
            <p className="text-sm text-muted">Votre profil est complet — excellent travail !</p>
          ) : (
            <ul className="space-y-2.5">
              {stats.missing.slice(0, 8).map((f) => (
                <li key={String(f)} className="flex items-center gap-2.5 text-sm text-ink">
                  <Circle className="w-3.5 h-3.5 text-muted shrink-0" />
                  Ajouter : {LABELS[f] ?? String(f)}
                </li>
              ))}
            </ul>
          )}
          <CTAButton to="/candidate/profile" variant="secondary" size="sm" className="mt-5">
            Compléter mon profil
          </CTAButton>
        </GlassCard>
      </div>

      <p className="mt-6 text-xs text-muted">
        Vos <Link to="/candidate/recommended" className="text-brand font-semibold">offres recommandées</Link> sont mises à jour automatiquement à mesure que vous complétez votre profil.
      </p>
    </div>
  );
}
