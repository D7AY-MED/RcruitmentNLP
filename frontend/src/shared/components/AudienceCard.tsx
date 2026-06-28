import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

/**
 * AudienceCard — a tall "for X audience" card with a checklist and a text CTA.
 * tone="brand" (indigo) or tone="cyan" (AI accent).
 */
export function AudienceCard({
  id,
  icon: Icon,
  tone,
  title,
  description,
  items,
  cta,
}: {
  id?: string;
  icon: ElementType;
  tone: 'brand' | 'cyan';
  title: string;
  description: string;
  items: string[];
  cta: { label: string; to: string };
}) {
  const isBrand = tone === 'brand';
  return (
    <GlassCard id={id} hover className="group h-full p-8">
      <span
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
          isBrand ? 'bg-brand-light text-brand' : 'bg-cyan-soft text-cyan',
        )}
      >
        <Icon className="w-6 h-6" />
      </span>
      <h3 className="font-display text-xl font-bold mb-2 text-ink">{title}</h3>
      <p className="text-sm leading-relaxed mb-5 text-muted">{description}</p>
      <ul className="space-y-2.5 mb-6">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
            <UserCheck
              className={cn('w-4 h-4 mt-0.5 shrink-0', isBrand ? 'text-brand' : 'text-cyan')}
            />
            {item}
          </li>
        ))}
      </ul>
      <Link
        to={cta.to}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
          isBrand ? 'text-brand hover:text-brand-hover' : 'text-cyan hover:text-cyan-hover',
        )}
      >
        {cta.label}
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </GlassCard>
  );
}

export default AudienceCard;
