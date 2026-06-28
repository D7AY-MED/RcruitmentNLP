'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { getActiveOffers } from '@/lib/candidateData';
import type { JobPool } from '@/lib/types';
import { PageHeader, GlassCard, Badge, SearchInput, LoadingState, EmptyState } from '@/shared/components';

/** Discover Jobs — authed candidate view of active public offers. */
export default function CandidateJobsPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<JobPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    getActiveOffers()
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return offers.filter(
      (o) =>
        o.title.toLowerCase().includes(t) ||
        (o.company_name || '').toLowerCase().includes(t) ||
        (o.location || '').toLowerCase().includes(t),
    );
  }, [offers, q]);

  if (loading) return <LoadingState label="Chargement des offres…" />;

  return (
    <div>
      <PageHeader title="Découvrir les offres" subtitle="Postulez aux offres qui vous correspondent." />

      <div className="mb-5 max-w-md">
        <SearchInput value={q} onChange={setQ} onClear={() => setQ('')} placeholder="Titre, entreprise, ville…" />
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState icon={Briefcase} title="Aucune offre trouvée" description="Revenez bientôt, de nouvelles offres sont publiées régulièrement." />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((o) => (
            <button key={o.id} type="button" onClick={() => navigate(`/apply/${o.public_slug}`)} className="text-left">
              <GlassCard hover className="group p-5 h-full">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  {o.contract_type && <Badge tone="blue">{o.contract_type}</Badge>}
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-ink truncate group-hover:text-brand transition-colors">{o.title}</h3>
                {o.company_name && <p className="text-sm text-muted truncate">{o.company_name}</p>}
                {o.location && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="w-3.5 h-3.5" /> {o.location}
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
    </div>
  );
}
