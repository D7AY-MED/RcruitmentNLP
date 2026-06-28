import type { ReactNode } from 'react';

/**
 * QuickActions — slot on the right of the header for the page's primary
 * action(s) (e.g. "Créer une offre"). Pure layout wrapper.
 */
export function QuickActions({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="flex items-center gap-2">{children}</div>;
}

export default QuickActions;
