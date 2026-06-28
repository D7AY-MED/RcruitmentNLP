import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GlassCardProps = {
  variant?: 'solid' | 'glass';
  hover?: boolean;
  className?: string;
  children: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

/**
 * GlassCard — the premium surface primitive.
 * variant="solid"  → opaque card surface (bg-card + soft border + shadow).
 * variant="glass"  → frosted glass (backdrop-blur) for overlays / sticky bars.
 * `hover` adds the lift-on-hover interaction. Token-only, dual-theme.
 * Forwards its ref to the underlying <div> (e.g. for the Fullscreen API).
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { variant = 'solid', hover = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border',
        variant === 'glass' ? 'glass' : 'bg-card border-border-brand shadow-sm',
        hover && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export default GlassCard;
