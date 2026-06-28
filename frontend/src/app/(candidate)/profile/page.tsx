'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  GraduationCap,
  Globe,
  Link,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  DollarSign,
  User,
  X,
} from 'lucide-react';
import {
  getCurrentCandidate,
  updateCandidateProfile,
  uploadProfilePicture,
  type Candidate,
} from '@/lib/candidateAuth';

type Mode = 'view' | 'edit';

export default function CandidateProfilePage() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draft, setDraft] = useState<Partial<Candidate>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showMessage(msg: { type: 'success' | 'error'; text: string }) {
    clearTimeout(msgTimer.current);
    setMessage(msg);
    msgTimer.current = setTimeout(() => setMessage(null), 3000);
  }

  function clearMessage() {
    clearTimeout(msgTimer.current);
    setMessage(null);
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' && window.localStorage.getItem('candidate_token');
    if (!token) {
      navigate('/login/candidate', { replace: true });
      return;
    }

    getCurrentCandidate()
      .then((user) => {
        setCandidate(user);
        setDraft({});
        setChecking(false);
      })
      .catch(() => {
        // Don't bounce to the landing page on a transient backend error —
        // just stop loading; the shell still guards the route.
        setChecking(false);
      });
  }, [navigate]);

  function startEdit() {
    if (!candidate) return;
    setDraft({ ...candidate });
    setMode('edit');
    clearMessage();
  }

  function cancelEdit() {
    setDraft({});
    setMode('view');
    clearMessage();
  }

  async function saveEdit() {
    if (!candidate) return;
    setSaving(true);
    clearMessage();
    try {
      const payload: Record<string, any> = {};
      for (const key of Object.keys(draft) as (keyof Candidate)[]) {
        if (['id', 'email', 'created_at'].includes(key)) continue;
        const val = draft[key];
        if (val === undefined) continue;
        if (typeof val === 'number' && isNaN(val)) continue;
        payload[key] = val;
      }
      const updated = await updateCandidateProfile(payload as Partial<Candidate>);
      setCandidate(updated);
      setMode('view');
      setDraft({});
      showMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err: any) {
      showMessage({ type: 'error', text: err?.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    clearMessage();
    try {
      const updated = await uploadProfilePicture(file);
      setCandidate(updated);
      showMessage({ type: 'success', text: 'Photo de profil mise à jour.' });
    } catch (err: any) {
      showMessage({ type: 'error', text: err?.message || 'Erreur lors du téléchargement.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function setDraftField<K extends keyof Candidate>(key: K, value: Candidate[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function initials(name: string) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const joinedDate = candidate?.created_at
    ? new Date(candidate.created_at).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light/35 dark:bg-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!candidate)
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center text-sm text-muted px-6">
        Impossible de charger votre profil pour le moment. Vérifiez votre connexion, puis réessayez.
      </div>
    );

  return (
    <div>
      {/* Message toast */}
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl text-sm font-bold transition-all ${
          message.type === 'success'
            ? 'bg-success-soft text-success border border-success/30'
            : 'bg-danger-soft text-danger border border-danger/30'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Mon profil</h1>
          <p className="mt-1 text-sm text-muted">Complétez votre profil pour de meilleures recommandations.</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'view' ? (
            <button
              onClick={startEdit}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-brand-contrast bg-brand hover:bg-brand-hover transition-all flex items-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="h-9 px-4 rounded-xl text-sm font-semibold text-brand-contrast bg-brand hover:bg-brand-hover transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enregistrer
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="h-9 px-4 rounded-xl text-sm font-semibold text-ink bg-surface-2 hover:bg-surface transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl">
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border-brand bg-white dark:bg-card p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full bg-brand-light border-2 border-brand/20 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {candidate.profile_picture_url ? (
                  <img
                    src={candidate.profile_picture_url}
                    alt={candidate.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-brand">
                    {initials(candidate.full_name)}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-ink">
                {candidate.full_name || '---'}
              </h1>
              {candidate.title && (
                <p className="text-base text-gray-550 dark:text-muted mt-1">{candidate.title}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                {candidate.open_to_work !== false && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Open to work
                  </span>
                )}
                {joinedDate && (
                  <span className="text-xs text-gray-400 dark:text-muted font-medium">
                    Membre depuis {joinedDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Fields Grid */}
        {mode === 'view' ? (
          <ViewMode candidate={candidate} />
        ) : (
          <EditMode draft={draft} onChange={setDraftField} />
        )}

        {/* Open to work toggle at bottom */}
        {mode === 'edit' && (
          <div className="rounded-2xl border border-border-brand bg-white dark:bg-card p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Open to work</p>
                <p className="text-xs text-gray-500 dark:text-muted mt-0.5">
                  Indiquer que vous êtes ouvert aux opportunités
                </p>
              </div>
              <button
                onClick={() => setDraftField('open_to_work', !draft.open_to_work)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  draft.open_to_work !== false ? 'bg-brand' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    draft.open_to_work !== false ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- View Mode ---------- */

function ViewMode({ candidate }: { candidate: Candidate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Personal Info */}
      <SectionCard title="Informations personnelles" icon={<User className="w-4 h-4 text-brand" />}>
        <Field label="Nom complet" value={candidate.full_name} />
        <Field label="Email" value={candidate.email} icon={<Mail className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />} />
        <Field label="Téléphone" value={candidate.phone} icon={<Phone className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />} />
        <Field label="Ville" value={candidate.city} icon={<MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />} />
      </SectionCard>

      {/* Professional */}
      <SectionCard title="Informations professionnelles" icon={<Briefcase className="w-4 h-4 text-brand" />}>
        <Field label="Poste actuel" value={candidate.current_job_title} />
        <Field label="Entreprise actuelle" value={candidate.current_company} icon={<Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />} />
        <Field label="Titre" value={candidate.title} />
        <Field
          label="Années d'expérience"
          value={candidate.years_of_experience != null ? `${candidate.years_of_experience} ans` : null}
        />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Formation" icon={<GraduationCap className="w-4 h-4 text-brand" />}>
        <Field label="Niveau d'études" value={candidate.education_level} />
        <Field label="Université" value={candidate.university_name} />
        <Field label="Domaine d'études" value={candidate.field_of_study} />
      </SectionCard>

      {/* Links & Salary */}
      <SectionCard title="Liens & Langues" icon={<Globe className="w-4 h-4 text-brand" />}>
        <Field
          label="LinkedIn"
          value={candidate.linkedin_url}
          icon={<Link className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />}
          isLink
        />
        <Field
          label="Langues"
          value={candidate.languages?.length ? candidate.languages.join(', ') : null}
        />
        <Field
          label="Salaire min"
          value={candidate.expected_salary_min != null ? `${candidate.expected_salary_min.toLocaleString()} €` : null}
          icon={<DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />}
        />
        <Field
          label="Salaire max"
          value={candidate.expected_salary_max != null ? `${candidate.expected_salary_max.toLocaleString()} €` : null}
          icon={<DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-muted" />}
        />
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-brand bg-white dark:bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-105 dark:border-border-brand">
        {icon}
        <h2 className="text-sm font-bold text-ink">{title}</h2>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, icon, isLink }: { label: string; value: string | null | undefined; icon?: React.ReactNode; isLink?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-450 dark:text-muted mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm font-medium text-ink flex items-center gap-1.5">
          {icon}
          {isLink ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">
              {value}
            </a>
          ) : (
            <span className="truncate">{value}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-300 dark:text-muted italic">—</p>
      )}
    </div>
  );
}

/* ---------- Edit Mode ---------- */

function EditMode({
  draft,
  onChange,
}: {
  draft: Partial<Candidate>;
  onChange: <K extends keyof Candidate>(key: K, value: Candidate[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Personal Info */}
      <SectionCard title="Informations personnelles" icon={<User className="w-4 h-4 text-brand" />}>
        <InputField label="Nom complet" value={draft.full_name || ''} onChange={(v) => onChange('full_name', v)} />
        <InputField label="Email" value={draft.email || ''} onChange={(v) => onChange('email', v)} disabled />
        <InputField label="Téléphone" value={draft.phone || ''} onChange={(v) => onChange('phone', v)} />
        <InputField label="Ville" value={draft.city || ''} onChange={(v) => onChange('city', v)} />
      </SectionCard>

      {/* Professional */}
      <SectionCard title="Informations professionnelles" icon={<Briefcase className="w-4 h-4 text-brand" />}>
        <InputField label="Poste actuel" value={draft.current_job_title || ''} onChange={(v) => onChange('current_job_title', v)} />
        <InputField label="Entreprise actuelle" value={draft.current_company || ''} onChange={(v) => onChange('current_company', v)} />
        <InputField label="Titre" value={draft.title || ''} onChange={(v) => onChange('title', v)} />
        <InputField label="Années d'expérience" value={draft.years_of_experience?.toString() || ''} onChange={(v) => { const n = parseInt(v, 10); onChange('years_of_experience', v && !isNaN(n) ? n : null as any); }} type="number" />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Formation" icon={<GraduationCap className="w-4 h-4 text-brand" />}>
        <InputField label="Niveau d'études" value={draft.education_level || ''} onChange={(v) => onChange('education_level', v)} />
        <InputField label="Université" value={draft.university_name || ''} onChange={(v) => onChange('university_name', v)} />
        <InputField label="Domaine d'études" value={draft.field_of_study || ''} onChange={(v) => onChange('field_of_study', v)} />
      </SectionCard>

      {/* Links & Salary */}
      <SectionCard title="Liens & Langues" icon={<Globe className="w-4 h-4 text-brand" />}>
        <InputField label="LinkedIn URL" value={draft.linkedin_url || ''} onChange={(v) => onChange('linkedin_url', v)} type="url" />
        <InputField label="Langues (séparées par des virgules)" value={draft.languages?.join(', ') || ''} onChange={(v) => onChange('languages', v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null as any)} />
        <InputField label="Salaire min (€)" value={draft.expected_salary_min?.toString() || ''} onChange={(v) => { const n = parseFloat(v); onChange('expected_salary_min', v && !isNaN(n) ? n : null as any); }} type="number" />
        <InputField label="Salaire max (€)" value={draft.expected_salary_max?.toString() || ''} onChange={(v) => { const n = parseFloat(v); onChange('expected_salary_max', v && !isNaN(n) ? n : null as any); }} type="number" />
      </SectionCard>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-450 dark:text-muted mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 px-3 rounded-xl border border-border-brand bg-white dark:bg-surface text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand/35 focus:border-brand transition-all disabled:bg-gray-50 dark:disabled:bg-surface-2 disabled:text-gray-400 dark:disabled:text-muted"
      />
    </div>
  );
}
