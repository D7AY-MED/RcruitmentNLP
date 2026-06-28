'use client';

import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { listSearchHistory, getSearchHistoryDetails } from '@/lib/jobPoolService';
import { PageHeader, GlassCard, LoadingState, EmptyState, CTAButton, Avatar } from '@/shared/components';

type PoolCandidate = {
  id?: string;
  name?: string;
  summary?: string;
  matchDescription?: string;
  email?: string;
  phone?: string;
};

/**
 * Talent pool = every candidate surfaced across the recruiter's past AI
 * searches, de-duplicated. Real data from the existing search-history API.
 */
export default function RecruiterTalentPoolPage() {
  const [candidates, setCandidates] = useState<PoolCandidate[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const history = await listSearchHistory();
        const recent = (Array.isArray(history) ? history : []).slice(0, 8);
        const details = await Promise.all(
          recent.map((h) => getSearchHistoryDetails((h as { id: string }).id).catch(() => null)),
        );
        const seen = new Map<string, PoolCandidate>();
        for (const d of details) {
          const list = (d as { candidates?: PoolCandidate[] } | null)?.candidates ?? [];
          for (const c of list) {
            const key = c.id || c.email || c.name || JSON.stringify(c);
            if (key && !seen.has(key)) seen.set(key, c);
          }
        }
        setCandidates([...seen.values()]);
      } catch {
        setCandidates([]);
      }
    })();
  }, []);

  if (candidates === null) return <LoadingState label="Constitution de votre vivier…" />;

  return (
    <div>
      <PageHeader title="Vivier de talents" subtitle="Tous les candidats issus de vos recherches IA." />
      {candidates.length === 0 ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={Users}
            title="Votre vivier est vide"
            description="Lancez une recherche de candidats : les profils trouvés apparaîtront ici."
            action={
              <CTAButton to="/recruiter/candidates" size="sm">
                <Search className="w-4 h-4" /> Rechercher des candidats
              </CTAButton>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c, i) => (
            <GlassCard key={c.id || c.email || i} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{c.name || 'Candidat'}</p>
                  {c.email && <p className="text-xs text-muted truncate">{c.email}</p>}
                </div>
              </div>
              {(c.summary || c.matchDescription) && (
                <p className="mt-3 text-sm text-muted line-clamp-3">{c.summary || c.matchDescription}</p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
