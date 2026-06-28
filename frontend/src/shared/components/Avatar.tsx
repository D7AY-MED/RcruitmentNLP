import { cn } from '@/lib/utils';

/**
 * Avatar — image or initials fallback. Token-only brand tint, both themes.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  const initials =
    (name ?? '')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '·';

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={cn('rounded-full object-cover border border-border-brand', dim, className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'rounded-full bg-brand-light text-brand font-bold flex items-center justify-center border border-border-brand',
        dim,
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export default Avatar;
