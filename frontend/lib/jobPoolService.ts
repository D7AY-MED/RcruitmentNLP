import { JobPool } from './types';
import { getToken } from './recruiterAuth';

const STATIC_HR_ID = '00000000-0000-0000-0000-000000000001';

export interface JobPoolInsert {
  title: string;
  description?: string | null;
  seniority_level?: string | null;
  main_mission: string;
  responsibilities?: string[] | null;
  must_have_skills: string[];
  nice_to_have_skills?: string[] | null;
  soft_skills?: string[] | null;
  deal_breakers?: string[] | null;
  languages?: string[] | null;
  years_experience?: number | null;
  notes?: string | null;
}

function generatePublicToken(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}

function mapDbRowToJobPool(row: any): JobPool {
  const profile = row.hr_profiles;
  return {
    id: row.id,
    public_slug: row.public_token,
    title: row.title,
    status: row.status ? 'active' : 'disabled',
    created_at: row.created_at,
    main_mission: row.main_mission || undefined,
    description: row.description || undefined,
    required_skills: row.must_have_skills || [],
    company_name: profile?.company_name || undefined,
    applicant_count: undefined,
    location: 'Remote',
    contract_type: 'CDI',
    experience_level: row.years_experience ? `${row.years_experience} ans` : (row.seniority_level || undefined),
    education_level: 'BAC +5',
    language: row.languages?.join(', ') || undefined,
    salary_range: 'A discuter',
    deadline: undefined,
    nice_to_have_skills: row.nice_to_have_skills || [],
    soft_skills: row.soft_skills || [],
    deal_breakers: row.deal_breakers || [],
    responsibilities: row.responsibilities || [],
    notes: row.notes || undefined,
  };
}

function apiUrl(path: string) {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createJobPool(payload: JobPoolInsert): Promise<JobPool> {
  const data = await apiFetch('/api/job-pools', {
    method: 'POST',
    body: JSON.stringify({
      hr_id: STATIC_HR_ID,
      public_token: generatePublicToken(payload.title),
      title: payload.title,
      description: payload.description || null,
      status: true,
      seniority_level: payload.seniority_level || null,
      main_mission: payload.main_mission,
      responsibilities: payload.responsibilities || null,
      must_have_skills: payload.must_have_skills,
      nice_to_have_skills: payload.nice_to_have_skills || null,
      soft_skills: payload.soft_skills || null,
      deal_breakers: payload.deal_breakers || null,
      languages: payload.languages || null,
      years_experience: payload.years_experience || null,
      notes: payload.notes || null,
    }),
  });
  return mapDbRowToJobPool(data);
}

export async function listJobPools(): Promise<JobPool[]> {
  const data = await apiFetch('/api/job-pools');
  return (data || []).map(mapDbRowToJobPool);
}

export async function getJobPool(id: string): Promise<JobPool | null> {
  try {
    const data = await apiFetch(`/api/job-pools/${id}`);
    return mapDbRowToJobPool(data);
  } catch (err: any) {
    if (err.message?.includes('404')) return null;
    throw err;
  }
}

export async function updateJobPoolStatus(id: string, status: boolean): Promise<JobPool | null> {
  const data = await apiFetch(`/api/job-pools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data ? mapDbRowToJobPool(data) : null;
}

export async function deleteJobPool(id: string): Promise<void> {
  await apiFetch(`/api/job-pools/${id}`, { method: 'DELETE' });
}

export async function getPublicJobPool(token: string): Promise<JobPool | null> {
  try {
    const data = await apiFetch(`/api/job-pools/public?token=${encodeURIComponent(token)}`);
    return mapDbRowToJobPool(data);
  } catch (err: any) {
    if (err.message?.includes('404')) return null;
    throw err;
  }
}
