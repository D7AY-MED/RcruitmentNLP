import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, Briefcase, MapPin, LayoutGrid } from 'lucide-react';
import { getActiveOffers } from '@/lib/candidateData';
import type { JobPool } from '@/lib/types';
import { EmptyState } from '../components/states';
import type { Role } from './types';

type NavLink = { label: string; to: string };

/**
 * GlobalSearch — header search trigger + ⌘K command palette.
 * Searches the role's pages, and (for candidates) active offers, then navigates.
 */
export function GlobalSearch({
  placeholder = 'Rechercher…',
  role,
  navItems = [],
}: {
  placeholder?: string;
  role?: Role;
  navItems?: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [offers, setOffers] = useState<JobPool[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lazy-load offers the first time the palette opens (candidate job search).
  useEffect(() => {
    if (open && role === 'candidate' && offers.length === 0) {
      getActiveOffers().then(setOffers).catch(() => {});
    }
  }, [open, role, offers.length]);

  const t = q.trim().toLowerCase();

  const pageResults = useMemo(() => {
    if (!t) return navItems.slice(0, 6);
    return navItems.filter((n) => n.label.toLowerCase().includes(t)).slice(0, 6);
  }, [navItems, t]);

  const offerResults = useMemo(() => {
    if (!t || role !== 'candidate') return [];
    return offers
      .filter(
        (o) =>
          o.title.toLowerCase().includes(t) ||
          (o.company_name || '').toLowerCase().includes(t) ||
          (o.location || '').toLowerCase().includes(t),
      )
      .slice(0, 6);
  }, [offers, t, role]);

  const close = () => {
    setOpen(false);
    setQ('');
  };
  const go = (to: string) => {
    close();
    navigate(to);
  };
  const offerPath = (o: JobPool) => `/apply/${o.public_slug}`;

  const onSubmit = () => {
    if (offerResults.length) go(offerPath(offerResults[0]));
    else if (pageResults.length) go(pageResults[0].to);
  };

  const noResults = !!t && offerResults.length === 0 && pageResults.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 h-10 px-3 rounded-xl bg-surface border border-border-brand text-sm text-muted hover:bg-surface-2 transition-colors min-w-[220px]"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border-brand">⌘K</kbd>
      </button>

      {/* mobile icon trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4 bg-bg/60 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border-brand bg-card shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border-brand">
              <Search className="w-4 h-4 text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder={role === 'candidate' ? 'Rechercher une offre, une page…' : 'Rechercher une page…'}
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border-brand text-muted">Esc</kbd>
            </div>

            {noResults ? (
              <EmptyState icon={CornerDownLeft} title="Aucun résultat" description="Essayez un autre mot-clé." className="py-12" />
            ) : (
              <div className="max-h-[55vh] overflow-y-auto py-2">
                {offerResults.length > 0 && (
                  <Section label="Offres">
                    {offerResults.map((o) => (
                      <ResultRow key={o.id} icon={Briefcase} title={o.title} subtitle={[o.company_name, o.location].filter(Boolean).join(' · ')} onClick={() => go(offerPath(o))} />
                    ))}
                  </Section>
                )}
                {pageResults.length > 0 && (
                  <Section label="Navigation">
                    {pageResults.map((n) => (
                      <ResultRow key={n.to} icon={LayoutGrid} title={n.label} onClick={() => go(n.to)} />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Briefcase;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-2 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink truncate">{title}</span>
        {subtitle && <span className="block text-xs text-muted truncate">{subtitle}</span>}
      </span>
    </button>
  );
}

export default GlobalSearch;
