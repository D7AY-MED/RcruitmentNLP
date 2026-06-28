import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * BrandLogo — the PooLink wordmark image. Shows the dark wordmark in light
 * mode and the white wordmark in dark mode. Use inside any anchor/link.
 * `white` forces the white version (e.g. on a gradient panel).
 */
export function BrandLogo({ className, white = false }: { className?: string; white?: boolean }) {
  if (white) {
    return <img src="/poolink-logo-white.png" alt="PooLink" className={cn('w-auto', className)} />;
  }
  return (
    <>
      <img src="/poolink-logo.png" alt="PooLink" className={cn('w-auto block dark:hidden', className)} />
      <img src="/poolink-logo-white.png" alt="PooLink" className={cn('w-auto hidden dark:block', className)} />
    </>
  );
}

/**
 * Logo — the PooLink brand mark as a link to home. Shared across every surface.
 */
export function Logo({ size = 'md', to = '/' }: { size?: 'sm' | 'md'; to?: string }) {
  const h = size === 'sm' ? 'h-5' : 'h-7';
  return (
    <Link to={to} aria-label="PooLink" className="inline-flex items-center">
      <BrandLogo className={h} />
    </Link>
  );
}

export default Logo;
