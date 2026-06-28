'use client';

import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Pencil, LogOut, Lock } from 'lucide-react';
import { logout as candidateLogout, changeCandidatePassword } from '@/lib/candidateAuth';
import { PageHeader, GlassCard, Button, Avatar, PasswordChangeForm } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

/** Candidate account settings. */
export default function CandidateSettingsPage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const navigate = useNavigate();

  const rows = [
    { icon: User, label: 'Nom complet', value: candidate?.full_name },
    { icon: Mail, label: 'E-mail', value: candidate?.email },
    { icon: Phone, label: 'Téléphone', value: candidate?.phone },
  ].filter((r) => r.value);

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Gérez votre compte candidat."
        actions={
          <Button size="sm" leftIcon={<Pencil className="w-4 h-4" />} onClick={() => navigate('/candidate/profile')}>
            Modifier le profil
          </Button>
        }
      />

      <GlassCard className="p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={candidate?.full_name} src={candidate?.profile_picture_url} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink truncate">{candidate?.full_name ?? 'Candidat'}</h2>
            {candidate?.title && <p className="text-sm text-muted truncate">{candidate.title}</p>}
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
              candidateLogout();
              navigate('/login/candidate', { replace: true });
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
        <PasswordChangeForm onSubmit={changeCandidatePassword} />
      </GlassCard>
    </div>
  );
}
