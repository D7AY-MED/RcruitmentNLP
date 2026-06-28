import { Reveal } from './Reveal';
import { Counter } from './Counter';

export type Stat = {
  /** numeric value to animate; null when using a static `display` string */
  value: number | null;
  display?: string;
  suffix?: string;
  prefix?: string;
  label: string;
};

/**
 * StatCard — a single headline metric with the gradient number treatment.
 * Animates via Counter when `value` is numeric, otherwise shows `display`.
 */
export function StatCard({ stat, delay = 0 }: { stat: Stat; delay?: number }) {
  return (
    <Reveal delay={delay} className="text-center">
      <p className="font-display text-3xl sm:text-4xl font-bold text-gradient">
        {stat.value !== null ? (
          <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
        ) : (
          stat.display
        )}
      </p>
      <p className="mt-2 text-sm font-medium text-muted">{stat.label}</p>
    </Reveal>
  );
}

export default StatCard;
