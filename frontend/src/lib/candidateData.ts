import { listPublicJobPools } from './jobPoolService';
import type { JobPool } from './types';
import type { Candidate } from './candidateAuth';

/* ── Active offers, cached in-memory (avoids refetching across pages) ── */

let offersCache: { at: number; data: JobPool[] } | null = null;
const OFFERS_TTL = 60_000; // 60s

export async function getActiveOffers(force = false): Promise<JobPool[]> {
  if (!force && offersCache && Date.now() - offersCache.at < OFFERS_TTL) {
    return offersCache.data;
  }
  const list = await listPublicJobPools();
  const active = (Array.isArray(list) ? list : []).filter((p) => p.status === 'active');
  offersCache = { at: Date.now(), data: active };
  return active;
}

/* ── Profile completion (shared derivation) ── */

export const PROFILE_SECTIONS: { title: string; fields: (keyof Candidate)[] }[] = [
  { title: 'Identité', fields: ['full_name', 'phone', 'city', 'linkedin_url'] },
  { title: 'Professionnel', fields: ['current_job_title', 'current_company', 'years_of_experience', 'title'] },
  { title: 'Formation', fields: ['education_level', 'university_name', 'field_of_study'] },
  { title: 'Préférences', fields: ['languages', 'expected_salary_min'] },
];

const LABELS: Partial<Record<keyof Candidate, string>> = {
  full_name: 'Nom complet',
  phone: 'Téléphone',
  city: 'Ville',
  linkedin_url: 'LinkedIn',
  current_job_title: 'Poste actuel',
  current_company: 'Entreprise actuelle',
  years_of_experience: "Années d'expérience",
  title: 'Titre / accroche',
  education_level: "Niveau d'études",
  university_name: 'Université',
  field_of_study: "Domaine d'études",
  languages: 'Langues',
  expected_salary_min: 'Salaire souhaité',
};

function filled(c: Candidate, f: keyof Candidate): boolean {
  const v = c[f];
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && v !== '';
}

export type ProfileStats = {
  pct: number;
  done: number;
  total: number;
  missing: { field: keyof Candidate; label: string }[];
  sections: { title: string; pct: number; done: number; total: number }[];
};

export function profileCompletion(c: Candidate | null): ProfileStats {
  const all = PROFILE_SECTIONS.flatMap((s) => s.fields);
  if (!c) return { pct: 0, done: 0, total: all.length, missing: [], sections: [] };
  const done = all.filter((f) => filled(c, f)).length;
  return {
    pct: Math.round((done / all.length) * 100),
    done,
    total: all.length,
    missing: all.filter((f) => !filled(c, f)).map((f) => ({ field: f, label: LABELS[f] ?? String(f) })),
    sections: PROFILE_SECTIONS.map((s) => {
      const d = s.fields.filter((f) => filled(c, f)).length;
      return { title: s.title, pct: Math.round((d / s.fields.length) * 100), done: d, total: s.fields.length };
    }),
  };
}
