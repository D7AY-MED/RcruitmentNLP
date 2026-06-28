import type { Candidate } from '@/lib/candidateAuth';
import type { JobPool } from '@/lib/types';

/**
 * Frontend match score (0–100) between a candidate profile and a job pool.
 * Pure derivation from existing data — weighted keyword overlap across the
 * pool's text and the candidate's field, role, title, location, education and
 * languages. No backend, no mock data.
 */
export function matchScore(c: Candidate, p: JobPool): number {
  const hay = [
    p.title,
    p.company_name,
    p.location,
    p.contract_type,
    (p as { required_skills?: unknown }).required_skills,
    p.description,
    (p as { main_mission?: unknown }).main_mission,
    p.experience_level,
    p.education_level,
    (p as { language?: unknown }).language,
  ]
    .map((x) => String(x ?? ''))
    .join(' ')
    .toLowerCase();

  const terms: { term?: string | null; w: number }[] = [
    { term: c.field_of_study, w: 3 },
    { term: c.current_job_title, w: 3 },
    { term: c.title, w: 2 },
    { term: c.city, w: 1 },
    { term: c.education_level, w: 1 },
    ...(c.languages ?? []).map((l) => ({ term: l, w: 1 })),
  ];

  let got = 0;
  let max = 0;
  for (const t of terms) {
    if (!t.term) continue;
    max += t.w;
    if (hay.includes(String(t.term).toLowerCase())) got += t.w;
  }
  if (max === 0) return 0;
  return Math.round((got / max) * 100);
}
