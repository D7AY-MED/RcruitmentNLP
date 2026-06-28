import { Quote, Star } from 'lucide-react';
import { GlassCard } from './GlassCard';

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

/**
 * TestimonialCard — quote card with rating, avatar initials, name + role.
 */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, name, role } = testimonial;
  return (
    <GlassCard className="h-full p-7 flex flex-col">
      <Quote className="w-7 h-7 text-[hsl(var(--indigo-600)/0.35)] mb-3" />
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, s) => (
          <Star key={s} className="w-4 h-4 fill-warning text-warning" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-ink flex-1">“{quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-grad-brand-soft border border-border-brand flex items-center justify-center text-xs font-bold text-brand">
          {name.split(' ').map((p) => p[0]).join('')}
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">{name}</span>
          <span className="block text-xs text-muted">{role}</span>
        </span>
      </figcaption>
    </GlassCard>
  );
}

export default TestimonialCard;
