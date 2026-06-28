import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from './types';

/**
 * Breadcrumbs — contextual trail in the header. Last crumb is the current page.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 min-w-0">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />}
            {last || !c.to ? (
              <span className={last ? 'text-sm font-semibold text-ink truncate' : 'text-sm text-muted truncate'}>
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="text-sm text-muted hover:text-ink transition-colors truncate">
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
