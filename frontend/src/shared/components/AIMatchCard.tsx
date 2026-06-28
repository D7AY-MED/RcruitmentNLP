import { GlassCard } from './GlassCard';

export type MatchCandidate = {
  name: string;
  role: string;
  score: number;
};

const DEFAULT_CANDIDATES: MatchCandidate[] = [
  { name: 'Sarah B.', role: 'Product Designer', score: 96 },
  { name: 'Adam K.', role: 'Frontend Engineer', score: 91 },
  { name: 'Lina M.', role: 'Data Analyst', score: 88 },
];

/**
 * AIMatchCard — the signature "Score de matching" card.
 * Cyan is used here intentionally as the AI / live accent (Live dot).
 * Default-exported so it can be React.lazy-loaded as a decorative chunk.
 */
export function AIMatchCard({
  candidates = DEFAULT_CANDIDATES,
  float = true,
}: {
  candidates?: MatchCandidate[];
  float?: boolean;
}) {
  return (
    <GlassCard className={'shadow-xl p-5' + (float ? ' animate-float' : '')}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          Score de matching
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" /> Live
        </span>
      </div>
      {candidates.map((c) => (
        <div key={c.name} className="flex items-center gap-3 py-2.5">
          <span className="w-9 h-9 rounded-full bg-grad-brand-soft border border-border-brand flex items-center justify-center text-xs font-bold text-brand">
            {c.name.split(' ').map((p) => p[0]).join('')}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-ink truncate">{c.name}</span>
            <span className="block text-xs text-muted truncate">{c.role}</span>
          </span>
          <span className="text-right">
            <span className="font-mono text-sm font-bold text-gradient">{c.score}%</span>
            <span className="mt-1 block h-1.5 w-16 rounded-full bg-surface-2 overflow-hidden">
              <span className="block h-full rounded-full bg-grad-brand" style={{ width: `${c.score}%` }} />
            </span>
          </span>
        </div>
      ))}
    </GlassCard>
  );
}

export default AIMatchCard;
