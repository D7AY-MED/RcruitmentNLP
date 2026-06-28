import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { Field, PasswordInput } from './Field';
import { Button } from './Button';

/**
 * PasswordChangeForm — self-service password change. Verifies match + length
 * client-side, then delegates to `onSubmit` (which calls the role's API).
 */
export function PasswordChangeForm({
  onSubmit,
}: {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) {
      setMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (next !== confirm) {
      setMsg({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    try {
      await onSubmit(current, next);
      setMsg({ type: 'success', text: 'Mot de passe mis à jour.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error)?.message || 'Échec de la mise à jour.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm">
      <Field label="Mot de passe actuel">
        <PasswordInput
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>
      <Field label="Nouveau mot de passe">
        <PasswordInput
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Min. 6 caractères"
        />
      </Field>
      <Field label="Confirmer le nouveau mot de passe">
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Field>
      {msg && <p className={msg.type === 'success' ? 'text-xs text-success' : 'text-xs text-danger'}>{msg.text}</p>}
      <Button type="submit" loading={loading} leftIcon={<Lock className="w-4 h-4" />}>
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}

export default PasswordChangeForm;
