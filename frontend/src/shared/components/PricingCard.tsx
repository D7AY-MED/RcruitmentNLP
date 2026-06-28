import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CTAButton } from './CTAButton';

export type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  to: string;
  featured?: boolean;
  badge?: string;
};

/**
 * PricingCard — a single pricing tier. The featured tier gets the brand
 * border + glow + lift and a "Populaire" badge.
 */
export function PricingCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        'relative h-full rounded-2xl p-7 border flex flex-col transition-all duration-300 bg-card',
        plan.featured
          ? 'border-brand shadow-glow md:-translate-y-2'
          : 'border-border-brand shadow-sm hover:shadow-lg hover:-translate-y-1',
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-brand-contrast bg-brand bg-grad-brand shadow-glow">
          <Sparkles className="w-3 h-3" /> {plan.badge ?? 'Populaire'}
        </span>
      )}
      <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
      <p className="text-sm text-muted mt-1 mb-5">{plan.description}</p>
      <div className="flex items-end gap-1 mb-6">
        <span className="font-display text-4xl font-bold text-ink">{plan.price}</span>
        {plan.period && <span className="text-sm text-muted mb-1">{plan.period}</span>}
      </div>
      <ul className="space-y-3 mb-7 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-brand-light flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-brand" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <CTAButton to={plan.to} variant={plan.featured ? 'primary' : 'secondary'} className="w-full">
        {plan.cta}
      </CTAButton>
    </div>
  );
}

export default PricingCard;
