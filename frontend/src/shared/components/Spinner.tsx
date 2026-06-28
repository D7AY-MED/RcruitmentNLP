import { cn } from '@/lib/utils';

/**
 * Spinner — token-coloured loading indicator (brand by default).
 */
export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        'inline-block rounded-full border-2 border-current border-t-transparent animate-spin text-brand',
        dim,
        className,
      )}
    />
  );
}

export default Spinner;
