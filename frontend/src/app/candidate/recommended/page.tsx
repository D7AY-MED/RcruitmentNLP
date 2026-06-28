'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Star, Briefcase, MapPin, ArrowRight, UserCircle, Sparkles, Loader2 } from 'lucide-react';
import { getActiveOffers } from '@/lib/candidateData';
import { getRecommendations, type AiRecommendation } from '@/lib/candidateAuth';
import type { JobPool } from '@/lib/types';
import { matchScore } from '@/lib/jobMatch';
import { PageHeader, GlassCard, Badge, SearchInput, LoadingState, EmptyState, CTAButton } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

type Ranked = { pool: JobPool; score: number; reason: string };

export default function CandidateRecommendedPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const navigate = useNavigate();
  const [pools, setPools] = useState<JobPool[] | null>(null);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[] | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [usedCv, setUsedCv] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    getActiveOffers().then(setPools).catch(() => setPools([]));
  }, []);

  useEffect(() => {
    let alive = true;
    getRecommendations()
      .then((r) => {
        if (!alive) return;
        setAiRecs(r.recommendations);
        setUsedCv(r.used_cv);
      })
      .catch(() => alive && setAiRecs([]))
      .finally(() => alive && setAiLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const hasProfile = !!(
    candidate &&
    (candidate.field_of_study ||
      candidate.current_job_title ||
      candidate.title ||
      candidate.city ||
      (candidate.languages && candidate.languages.length))
  );

  const aiActive = !!(aiRecs && aiRecs.length);

  const ranked: Ranked[] = useMemo(() => {
    if (!pools) return [];
    const byId = new Map(pools.map((p) => [p.id, p]));
    if (aiRecs && aiRecs.length) {
      return aiRecs
        .map((r): Ranked | null => {
          const pool = byId.get(r.pool_id);
          return pool ? { pool, score: r.score, reason: r.reason } : null;
        })
        .filter((x): x is Ranked => x !== null);
    }
    if (!candidate) return [];
    return pools
      .map((p) => ({ pool: p, score: matchScore(candidate, p), reason: '' }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [pools, aiRecs, candidate]);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ranked;
    return ranked.filter(
      ({ pool }) =>
        pool.title.toLowerCase().includes(t) ||
        (pool.company_name || '').toLowerCase().includes(t) ||
        (pool.location || '').toLowerCase().includes(t),
    );
  }, [ranked, q]);

  if (pools === null) return <LoadingState label="Recherche des meilleures offres…" />;

  return (
    <div>
      <PageHeader
        title="Offres recommandées"
        subtitle={aiActive ? "Sélectionnées par l'IA selon votre profil et votre CV." : 'Classées selon votre profil par notre moteur de matching.'}
      />

      {/* AI status banner */}
      <GlassCard className="mb-6 p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-grad-brand text-brand-contrast flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <div className="text-sm leading-relaxed">
          {aiLoading ? (
            <span className="flex items-center gap-2 text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse IA de votre profil{usedCv ? ' et de votre CV' : ''}…
            </span>
          ) : aiActive ? (
            <span className="text-ink">
              Recommandations générées par IA selon votre profil{usedCv ? ' et votre CV' : ''}.{' '}
              {!usedCv && (
                <span className="text-muted">
                  <Link to="/candidate/resume" className="text-brand font-semibold">Importez votre CV</Link> pour les affiner.
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">
              Classement par compatibilité.{' '}
              <Link to="/candidate/resume" className="text-brand font-semibold">Importez votre CV</Link> et complétez votre profil pour des recommandations IA.
            </span>
          )}
        </div>
      </GlassCard>

      {!hasProfile && !aiActive ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={UserCircle}
            title="Commencez par compléter votre profil"
            description="Ajoutez votre domaine, votre poste et vos compétences (et importez votre CV) pour recevoir des recommandations IA pertinentes."
            action={<CTAButton to="/candidate/profile" size="sm">Compléter mon profil</CTAButton>}
          />
        </GlassCard>
      ) : ranked.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState icon={Briefcase} title="Aucune offre disponible" description="Revenez bientôt, de nouvelles offres sont publiées régulièrement." />
        </GlassCard>
      ) : (
        <>
          <div className="mb-5 max-w-md">
            <SearchInput value={q} onChange={setQ} onClear={() => setQ('')} placeholder="Filtrer par poste, entreprise, ville…" />
          </div>
          {visible.length === 0 ? (
            <GlassCard className="p-2">
              <EmptyState icon={Briefcase} title="Aucun résultat" description="Essayez un autre mot-clé." />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visible.map(({ pool, score, reason }) => (
                <button key={pool.id} type="button" onClick={() => navigate(`/apply/${pool.public_slug}`)} className="text-left">
              <GlassCard hover className="group p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <Badge tone={score >= 60 ? 'success' : score >= 30 ? 'cyan' : 'neutral'}>
                    <Star className="w-3 h-3" /> {score}% match
                  </Badge>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-ink truncate group-hover:text-brand transition-colors">{pool.title}</h3>
                {pool.company_name && <p className="text-sm text-muted truncate">{pool.company_name}</p>}
                {pool.location && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="w-3.5 h-3.5" /> {pool.location}
                  </p>
                )}
                {reason && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-2 px-2.5 py-2 text-xs text-ink leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                    {reason}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Voir l'offre <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                  </GlassCard>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        Astuce : <Link to="/candidate/profile" className="text-brand font-semibold">complétez votre profil</Link> et gardez votre <Link to="/candidate/resume" className="text-brand font-semibold">CV</Link> à jour pour de meilleures recommandations.
      </p>
    </div>
  );
}
