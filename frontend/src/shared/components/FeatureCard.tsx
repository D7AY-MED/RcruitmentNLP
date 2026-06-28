import type { ElementType } from 'react';
import { Reveal } from './Reveal';
import { GlassCard } from './GlassCard';

/**
 * FeatureCard — icon tile + title + description in a hover-lift card.
 * Accent picks the icon-tile treatment: indigo brand or cyan AI accent.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = 'brand',
  delay = 0,
}: {
  icon: ElementType;
  title: string;
  description: string;
  accent?: 'brand' | 'cyan';
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <GlassCard hover className="group h-full p-7">
        <span
          className={
            'w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ' +
            (accent === 'cyan' ? 'bg-cyan-soft text-cyan' : 'bg-brand-light text-brand')
          }
        >
          <Icon className="w-5 h-5" />
        </span>
        <h3 className="font-display text-lg font-bold mb-2 text-ink">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </GlassCard>
    </Reveal>
  );
}

export default FeatureCard;
