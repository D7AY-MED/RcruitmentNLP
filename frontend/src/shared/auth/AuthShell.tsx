import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Logo, BrandLogo } from '../components/Logo';
import { AIMatchCard } from '../components/AIMatchCard';
import type { Role } from '../layout/types';
import type { AuthMode } from './AuthForm';
import { authConfig } from './roleAuth';

const BULLETS = [
  'Matching sémantique des candidatures',
  'Entretiens IA conversationnels',
  'Tableau de bord clair et premium',
];

/**
 * AuthShell — the split-screen layout shared by every role's login & register.
 * Left: brand panel (gradient, value prop). Right: the form. Identical design
 * for recruiter / candidate / admin — only the role label/copy changes.
 * Token-only, light + dark, responsive (panel hides on small screens).
 */
export function AuthShell({
  role,
  mode,
  children,
}: {
  role: Role;
  mode: AuthMode;
  children: ReactNode;
}) {
  const cfg = authConfig[role];
  const register = mode === 'register';
  const heading = register ? `Créer un compte ${cfg.label.toLowerCase()}` : `Connexion ${cfg.label.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand bg-grad-brand p-12 text-brand-contrast">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center" aria-label="PooLink">
            <BrandLogo white className="h-7" />
          </Link>
        </div>
        <div className="relative max-w-sm">
          <h2 className="font-display text-3xl font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Le recrutement, augmenté par l'IA.
          </h2>
          <p className="mt-3 text-sm text-white/80">{cfg.blurb}</p>
          <ul className="mt-6 space-y-2.5">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-white/90">
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-[300px]">
            <AIMatchCard float={false} />
          </div>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} PooLink</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-5 h-16 lg:hidden border-b border-border-brand">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">
            <div className="hidden lg:flex justify-end mb-6">
              <ThemeToggle />
            </div>

            <Link to={register ? '/get-started' : '/login'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6">
              <ArrowLeft className="w-3.5 h-3.5" />
              Changer d'espace
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand-light text-brand border border-border-brand mb-3">
              Espace {cfg.label}
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink mb-1">{heading}</h1>
            <p className="text-sm text-muted mb-7">
              {register ? 'Quelques informations pour démarrer.' : 'Heureux de vous revoir.'}
            </p>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
