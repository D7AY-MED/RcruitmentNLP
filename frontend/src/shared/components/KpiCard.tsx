import type { ElementType } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

export type KpiTone = 'brand' | 'blue' | 'cyan' | 'success' | 'warning' | 'danger';

const toneTile: Record<KpiTone, string> = {
  brand: 'bg-brand-light text-brand',
  blue: 'bg-brand-accent-50 text-brand-accent',
  cyan: 'bg-cyan-soft text-cyan',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/**
 * KpiCard — headline metric tile for dashboards. Mono value, optional trend.
 * Token-only tones, both themes.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: ElementType;
  tone?: KpiTone;
  /** signed percentage, e.g. +12 or -4 */
  delta?: number;
  hint?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && (
          <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', toneTile[tone])}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-ink tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              up ? 'text-success' : 'text-danger',
            )}
          >
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </GlassCard>
  );
}

export default KpiCard;
