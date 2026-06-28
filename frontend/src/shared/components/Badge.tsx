import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge — semantic status pill. Tones map to Aurora tokens only, so they work
 * in both themes. Legacy admin tone names (gray/green/red/indigo/amber/blue)
 * are accepted as aliases to ease the admin migration.
 */
export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'blue'
  | 'cyan'
  | 'success'
  | 'warning'
  | 'danger'
  // legacy aliases
  | 'gray'
  | 'green'
  | 'red'
  | 'indigo'
  | 'amber';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  gray: 'bg-surface-2 text-muted',
  brand: 'bg-brand-light text-brand',
  indigo: 'bg-brand-light text-brand',
  blue: 'bg-brand-accent-50 text-brand-accent',
  cyan: 'bg-cyan-soft text-cyan',
  success: 'bg-success-soft text-success',
  green: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  amber: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  red: 'bg-danger-soft text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot = false,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export default Badge;
