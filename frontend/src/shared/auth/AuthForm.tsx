import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, Input, PasswordInput } from '../components/Field';
import type { Role } from '../layout/types';
import { authConfig, type AuthFields } from './roleAuth';

export type AuthMode = 'login' | 'register';

/**
 * AuthForm — identical form for every role. Submits to that role's existing
 * backend via roleAuth. Reused by the auth pages AND the candidate apply modal.
 *
 * - In a page: omit `onSuccess` → it navigates to the role's post-auth home.
 * - In the modal: pass `onSuccess` → it calls back (e.g. continue to interview)
 *   and `onSwitchMode` to toggle login/register in place (no navigation).
 */
export function AuthForm({
  role,
  mode,
  onSuccess,
  onSwitchMode,
}: {
  role: Role;
  mode: AuthMode;
  onSuccess?: () => void;
  onSwitchMode?: (mode: AuthMode) => void;
}) {
  const cfg = authConfig[role];
  const navigate = useNavigate();
  const [fields, setFields] = useState<AuthFields>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof AuthFields) => (e: { target: { value: string } }) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const isRegister = mode === 'register';
  const extra = isRegister ? cfg.registerFields : [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!cfg.register) throw new Error('Inscription indisponible pour ce rôle.');
        await cfg.register(fields);
      } else {
        await cfg.login(fields);
      }
      if (onSuccess) onSuccess();
      else navigate(isRegister ? cfg.registerHome : cfg.loginHome, { replace: true });
    } catch (err) {
      setError((err as Error)?.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const switchMode = isRegister ? 'login' : 'register';
  const switchPrompt = isRegister ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?';
  const switchLabel = isRegister ? 'Se connecter' : 'Créer un compte';

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {extra.includes('full_name') && (
        <Field label="Nom complet" htmlFor="full_name">
          <Input id="full_name" autoComplete="name" required value={fields.full_name ?? ''} onChange={set('full_name')} placeholder="Jean Dupont" />
        </Field>
      )}

      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={fields.email} onChange={set('email')} placeholder="vous@exemple.com" />
      </Field>

      {extra.includes('company_name') && (
        <Field label="Entreprise" htmlFor="company_name">
          <Input id="company_name" autoComplete="organization" required value={fields.company_name ?? ''} onChange={set('company_name')} placeholder="Votre société" />
        </Field>
      )}

      {extra.includes('phone') && (
        <Field label="Téléphone" htmlFor="phone" hint="Optionnel">
          <Input id="phone" type="tel" autoComplete="tel" value={fields.phone ?? ''} onChange={set('phone')} placeholder="+33 6 12 34 56 78" />
        </Field>
      )}

      <Field label="Mot de passe" htmlFor="password" error={error || undefined}>
        <PasswordInput
          id="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          minLength={isRegister ? 6 : undefined}
          value={fields.password}
          onChange={set('password')}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
        {isRegister ? `Créer mon compte ${cfg.label.toLowerCase()}` : 'Se connecter'}
      </Button>

      {(cfg.canRegister || !isRegister) && (
        <p className="text-center text-sm text-muted">
          {switchPrompt}{' '}
          {onSwitchMode ? (
            <button
              type="button"
              onClick={() => {
                setError('');
                onSwitchMode(switchMode);
              }}
              className="font-semibold text-brand hover:text-brand-hover"
            >
              {switchLabel}
            </button>
          ) : (
            <Link to={`/${switchMode === 'register' ? 'register' : 'login'}/${role}`} className="font-semibold text-brand hover:text-brand-hover">
              {switchLabel}
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export default AuthForm;
