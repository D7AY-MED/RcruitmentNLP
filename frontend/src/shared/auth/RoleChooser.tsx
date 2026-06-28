import { Link } from 'react-router-dom';
import { Briefcase, UserCircle, ArrowRight, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { Logo } from '../components/Logo';
import type { AuthMode } from './AuthForm';
import type { Role } from '../layout/types';
import { authConfig } from './roleAuth';

type RoleCard = { role: Role; icon: ElementType; tone: string };

// Admin is intentionally NOT listed here — admins reach their login only by
// typing the URL (/admin/login). The public landing never exposes it.
const CARDS: RoleCard[] = [
  { role: 'recruiter', icon: Briefcase, tone: 'bg-brand-light text-brand' },
  { role: 'candidate', icon: UserCircle, tone: 'bg-cyan-soft text-cyan' },
];

/**
 * RoleChooser — "Continue as…" screen for /login and /get-started.
 * In register mode, Admin is invite-only and points to its login.
 * Token-only, light + dark.
 */
export function RoleChooser({ mode }: { mode: AuthMode }) {
  const register = mode === 'register';
  const title = register ? 'Commencez avec PooLink' : 'Bon retour sur PooLink';
  const subtitle = register
    ? 'Choisissez votre espace pour créer votre compte.'
    : 'Choisissez votre espace pour vous connecter.';

  return (
    <div className="relative min-h-screen bg-bg text-ink flex flex-col">
      <div className="absolute inset-0 -z-10 bg-mesh" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-50" />

      <header className="mx-auto w-full max-w-5xl px-5 h-16 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-brand-light text-brand border border-border-brand mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Recrutement augmenté par l'IA
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            <p className="mt-3 text-base text-muted">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {CARDS.map(({ role, icon: Icon, tone }) => {
              const cfg = authConfig[role];
              const inviteOnly = register && !cfg.canRegister;
              const to = inviteOnly ? `/login/${role}` : `/${register ? 'register' : 'login'}/${role}`;
              return (
                <Link
                  key={role}
                  to={to}
                  className="group rounded-2xl border border-border-brand bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col"
                >
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tone}`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <h2 className="font-display text-lg font-bold text-ink">{cfg.label}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted flex-1">{cfg.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                    {inviteOnly ? 'Se connecter' : register ? 'Créer un compte' : 'Continuer'}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {inviteOnly && <span className="mt-1 text-xs text-muted">Accès sur invitation</span>}
                </Link>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            {register ? (
              <>Vous avez déjà un compte ? <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">Se connecter</Link></>
            ) : (
              <>Nouveau sur PooLink ? <Link to="/get-started" className="font-semibold text-brand hover:text-brand-hover">Commencer</Link></>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

export default RoleChooser;
