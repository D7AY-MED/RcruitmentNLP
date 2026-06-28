'use client';

import { useState } from 'react';
import { Building2, Globe, Mail, Phone, MapPin, Pencil } from 'lucide-react';
import RecruiterProfileModal from '@/components/RecruiterProfileModal';
import { useRecruiter, useRecruiterContext } from '@/lib/recruiter-context';
import { PageHeader, GlassCard, Button } from '@/shared/components';

/** Company — reuses the existing recruiter profile modal (company tab). */
export default function RecruiterCompanyPage() {
  const user = useRecruiter();
  const { refreshUser } = useRecruiterContext();
  const [open, setOpen] = useState(false);

  const rows = [
    { icon: Building2, label: 'Secteur', value: user.companyIndustry },
    { icon: Globe, label: 'Site web', value: user.companyWebsite },
    { icon: Mail, label: 'E-mail', value: user.companyEmail },
    { icon: Phone, label: 'Téléphone', value: user.companyPhone },
    { icon: MapPin, label: 'Adresse', value: user.companyAddress },
  ].filter((r) => r.value);

  return (
    <div>
      <PageHeader
        title="Entreprise"
        subtitle="Les informations affichées aux candidats."
        actions={
          <Button size="sm" leftIcon={<Pencil className="w-4 h-4" />} onClick={() => setOpen(true)}>
            Modifier
          </Button>
        }
      />

      <GlassCard className="p-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-grad-brand-soft border border-border-brand flex items-center justify-center text-brand">
            <Building2 className="w-7 h-7" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-ink truncate">{user.companyName ?? 'Votre entreprise'}</h2>
            {user.companySize && <p className="text-sm text-muted">{user.companySize}</p>}
          </div>
        </div>

        {user.companyDescription && (
          <p className="mt-5 text-sm leading-relaxed text-muted">{user.companyDescription}</p>
        )}

        {rows.length > 0 && (
          <dl className="mt-6 grid sm:grid-cols-2 gap-4">
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
        )}
      </GlassCard>

      <RecruiterProfileModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        initialTab="settings"
        onSaved={refreshUser}
      />
    </div>
  );
}
