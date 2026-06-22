'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  GraduationCap,
  Globe,
  Link,
  Loader2,
  LogOut,
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
  logout as logoutCandidate,
  updateCandidateProfile,
  uploadProfilePicture,
  type Candidate,
} from '@/lib/candidateAuth';

type Mode = 'view' | 'edit';

export default function CandidateProfilePage() {
  const router = useRouter();
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
      router.replace('/');
      return;
    }

    getCurrentCandidate()
      .then((user) => {
        setCandidate(user);
        setDraft({});
        setChecking(false);
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router]);

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

  function handleLogout() {
    logoutCandidate();
    router.replace('/');
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200/80 bg-white/90 sticky top-0 z-40"
        style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, #2563EB, #60A5FA)' }}>
              PooLink
            </span>
          </a>
          <div className="flex items-center gap-3">
            {mode === 'view' ? (
              <>
                <button
                  onClick={startEdit}
                  className="h-9 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={handleLogout}
                  className="h-9 px-4 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="h-9 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="h-9 px-4 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Message toast */}
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl text-sm font-bold transition-all ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {candidate.profile_picture_url ? (
                  <img
                    src={candidate.profile_picture_url}
                    alt={candidate.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600">
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
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {candidate.full_name || '---'}
              </h1>
              {candidate.title && (
                <p className="text-base text-gray-500 mt-1">{candidate.title}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                {candidate.open_to_work !== false && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Open to work
                  </span>
                )}
                {joinedDate && (
                  <span className="text-xs text-gray-400 font-medium">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Open to work</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Indiquer que vous êtes ouvert aux opportunités
                </p>
              </div>
              <button
                onClick={() => setDraftField('open_to_work', !draft.open_to_work)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  draft.open_to_work !== false ? 'bg-blue-600' : 'bg-gray-300'
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
      </main>
    </div>
  );
}

/* ---------- View Mode ---------- */

function ViewMode({ candidate }: { candidate: Candidate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Personal Info */}
      <SectionCard title="Informations personnelles" icon={<User className="w-4 h-4 text-blue-600" />}>
        <Field label="Nom complet" value={candidate.full_name} />
        <Field label="Email" value={candidate.email} icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} />
        <Field label="Téléphone" value={candidate.phone} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
        <Field label="Ville" value={candidate.city} icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} />
      </SectionCard>

      {/* Professional */}
      <SectionCard title="Informations professionnelles" icon={<Briefcase className="w-4 h-4 text-blue-600" />}>
        <Field label="Poste actuel" value={candidate.current_job_title} />
        <Field label="Entreprise actuelle" value={candidate.current_company} icon={<Building2 className="w-3.5 h-3.5 text-gray-400" />} />
        <Field label="Titre" value={candidate.title} />
        <Field
          label="Années d'expérience"
          value={candidate.years_of_experience != null ? `${candidate.years_of_experience} ans` : null}
        />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Formation" icon={<GraduationCap className="w-4 h-4 text-blue-600" />}>
        <Field label="Niveau d'études" value={candidate.education_level} />
        <Field label="Université" value={candidate.university_name} />
        <Field label="Domaine d'études" value={candidate.field_of_study} />
      </SectionCard>

      {/* Links & Salary */}
      <SectionCard title="Liens & Langues" icon={<Globe className="w-4 h-4 text-blue-600" />}>
        <Field
          label="LinkedIn"
          value={candidate.linkedin_url}
          icon={<Link className="w-3.5 h-3.5 text-gray-400" />}
          isLink
        />
        <Field
          label="Langues"
          value={candidate.languages?.length ? candidate.languages.join(', ') : null}
        />
        <Field
          label="Salaire min"
          value={candidate.expected_salary_min != null ? `${candidate.expected_salary_min.toLocaleString()} €` : null}
          icon={<DollarSign className="w-3.5 h-3.5 text-gray-400" />}
        />
        <Field
          label="Salaire max"
          value={candidate.expected_salary_max != null ? `${candidate.expected_salary_max.toLocaleString()} €` : null}
          icon={<DollarSign className="w-3.5 h-3.5 text-gray-400" />}
        />
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        {icon}
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
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
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          {icon}
          {isLink ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
              {value}
            </a>
          ) : (
            <span className="truncate">{value}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-300 italic">—</p>
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
      <SectionCard title="Informations personnelles" icon={<User className="w-4 h-4 text-blue-600" />}>
        <InputField label="Nom complet" value={draft.full_name || ''} onChange={(v) => onChange('full_name', v)} />
        <InputField label="Email" value={draft.email || ''} onChange={(v) => onChange('email', v)} disabled />
        <InputField label="Téléphone" value={draft.phone || ''} onChange={(v) => onChange('phone', v)} />
        <InputField label="Ville" value={draft.city || ''} onChange={(v) => onChange('city', v)} />
      </SectionCard>

      {/* Professional */}
      <SectionCard title="Informations professionnelles" icon={<Briefcase className="w-4 h-4 text-blue-600" />}>
        <InputField label="Poste actuel" value={draft.current_job_title || ''} onChange={(v) => onChange('current_job_title', v)} />
        <InputField label="Entreprise actuelle" value={draft.current_company || ''} onChange={(v) => onChange('current_company', v)} />
        <InputField label="Titre" value={draft.title || ''} onChange={(v) => onChange('title', v)} />
        <InputField label="Années d'expérience" value={draft.years_of_experience?.toString() || ''} onChange={(v) => { const n = parseInt(v, 10); onChange('years_of_experience', v && !isNaN(n) ? n : null as any); }} type="number" />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Formation" icon={<GraduationCap className="w-4 h-4 text-blue-600" />}>
        <InputField label="Niveau d'études" value={draft.education_level || ''} onChange={(v) => onChange('education_level', v)} />
        <InputField label="Université" value={draft.university_name || ''} onChange={(v) => onChange('university_name', v)} />
        <InputField label="Domaine d'études" value={draft.field_of_study || ''} onChange={(v) => onChange('field_of_study', v)} />
      </SectionCard>

      {/* Links & Salary */}
      <SectionCard title="Liens & Langues" icon={<Globe className="w-4 h-4 text-blue-600" />}>
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
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}
