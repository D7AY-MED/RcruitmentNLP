'use client';

import { useState } from 'react';
import { User, Mail, Phone, Pencil, LogOut, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RecruiterProfileModal from '@/components/RecruiterProfileModal';
import { useRecruiter, useRecruiterContext } from '@/lib/recruiter-context';
import { logout, changeRecruiterPassword } from '@/lib/recruiterAuth';
import { PageHeader, GlassCard, Button, Avatar, PasswordChangeForm } from '@/shared/components';

/** Settings — recruiter account; reuses the existing profile modal (profile tab). */
export default function RecruiterSettingsPage() {
  const user = useRecruiter();
  const { refreshUser } = useRecruiterContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const rows = [
    { icon: User, label: 'Nom complet', value: user.fullName },
    { icon: Mail, label: 'E-mail', value: user.email },
    { icon: Phone, label: 'Téléphone', value: user.phone },
  ].filter((r) => r.value);

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Gérez votre compte recruteur."
        actions={
          <Button size="sm" leftIcon={<Pencil className="w-4 h-4" />} onClick={() => setOpen(true)}>
            Modifier le profil
          </Button>
        }
      />

      <GlassCard className="p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink truncate">{user.fullName ?? 'Recruteur'}</h2>
            {user.companyName && <p className="text-sm text-muted truncate">{user.companyName}</p>}
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-surface-2 text-muted flex items-center justify-center shrink-0">
                <r.icon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <dt className="text-xs text-muted">{r.label}</dt>
                <dd className="text-sm text-ink truncate">{r.value}</dd>
              </span>
            </div>
          ))}
        </dl>

        <div className="mt-7 pt-6 border-t border-border-brand">
          <Button
            variant="danger"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => {
              logout();
              navigate('/login/recruiter', { replace: true });
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6 max-w-2xl mt-6">
        <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand" /> Sécurité
        </h2>
        <PasswordChangeForm onSubmit={changeRecruiterPassword} />
      </GlassCard>

      <RecruiterProfileModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        initialTab="profile"
        onSaved={refreshUser}
      />
    </div>
  );
}
