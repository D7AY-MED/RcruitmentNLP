import { Reveal } from './Reveal';

/**
 * SectionHeading — eyebrow pill + title + optional subtitle, centered.
 * Reused by every marketing/section block.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  const centered = align === 'center';
  return (
    <div className={centered ? 'text-center mb-14 max-w-2xl mx-auto' : 'mb-14 max-w-2xl'}>
      {eyebrow && (
        <Reveal
          className={
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ' +
            'bg-brand-light text-brand border border-border-brand mb-4'
          }
        >
          {eyebrow}
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink"
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className={centered ? 'mt-3 text-base text-muted' : 'mt-3 text-base text-muted max-w-xl'}>
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export default SectionHeading;
