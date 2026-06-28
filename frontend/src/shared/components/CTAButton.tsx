import type { ComponentPropsWithoutRef, MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * CTAButton — the single source of truth for button styling.
 * Renders a react-router <Link> (to), an <a> (href, e.g. in-page anchors),
 * or a <button>. All colours come from Aurora semantic tokens — no hardcoded
 * hex — so every variant works in both light and dark mode.
 */
export type CTAVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'onbrand' // solid contrast button on top of a gradient panel
  | 'onbrand-outline';

export type CTASize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-60 disabled:pointer-events-none';

const variants: Record<CTAVariant, string> = {
  primary:
    'text-brand-contrast bg-brand bg-grad-brand shadow-glow hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'text-ink bg-surface border border-border-brand hover:bg-surface-2 hover:-translate-y-0.5',
  ghost: 'text-muted hover:text-ink hover:bg-surface',
  onbrand:
    'bg-brand-contrast text-brand-700 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-brand-contrast focus-visible:ring-offset-0',
  // Translucent outline sits on the fixed brand-gradient panel (same in both
  // themes), so white-with-alpha is the correct theme-independent contrast.
  'onbrand-outline':
    'border-2 border-white/30 text-brand-contrast hover:bg-white/10 hover:-translate-y-0.5 focus-visible:ring-brand-contrast focus-visible:ring-offset-0',
};

const sizes: Record<CTASize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
};

type CommonProps = {
  variant?: CTAVariant;
  size?: CTASize;
  className?: string;
  children: ReactNode;
};

type AsLink = CommonProps & {
  to: string;
  href?: never;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};
type AsAnchor = CommonProps & { href: string; to?: never } & ComponentPropsWithoutRef<'a'>;
type AsButton = CommonProps & { to?: never; href?: never } & ComponentPropsWithoutRef<'button'>;

export function CTAButton(props: AsLink | AsAnchor | AsButton) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const cls = cn(base, variants[variant], sizes[size], className);

  if ('to' in props && props.to) {
    const { to, onClick } = props;
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if ('href' in props && props.href) {
    const { href, to: _to, variant: _v, size: _s, className: _c, children: _ch, ...rest } =
      props as AsAnchor;
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  const { to: _to, href: _h, variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as AsButton;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export default CTAButton;
