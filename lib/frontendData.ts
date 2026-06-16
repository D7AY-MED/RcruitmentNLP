import { AuthUser, Candidate, JobPool, SearchHistoryItem, StudentApplicant } from '@/lib/types';

export const demoUser: AuthUser = {
  id: 'demo-recruiter',
  email: 'recruiter@example.com',
  fullName: 'Demo Recruiter',
  companyName: 'xQuesty',
};

export const demoCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Maya Chen',
    summary: 'Frontend engineer with strong React, TypeScript, and design-system experience.',
    matchDescription: 'Strong fit for component architecture, accessibility, and product collaboration.',
    phone: '+1 555 0101',
    email: 'maya.chen@example.com',
    cv_url: '#',
  },
  {
    id: 'cand-2',
    name: 'Adam Rivera',
    summary: 'Full-stack developer focused on Next.js dashboards and data-heavy workflows.',
    matchDescription: 'Matches the need for pragmatic UI delivery and business-facing tooling.',
    phone: '+1 555 0102',
    email: 'adam.rivera@example.com',
    cv_url: '#',
  },
  {
    id: 'cand-3',
    name: 'Nora Patel',
    summary: 'Product-minded engineer with experience shipping polished recruiting interfaces.',
    matchDescription: 'Excellent communication profile with strong UX judgment.',
    phone: '+1 555 0103',
    email: 'nora.patel@example.com',
    cv_url: '#',
  },
  {
    id: 'cand-4',
    name: 'Jon Bell',
    summary: 'React specialist with a background in performance tuning and component libraries.',
    matchDescription: 'Good match for fast iteration and maintainable frontend systems.',
    phone: '+1 555 0104',
    email: 'jon.bell@example.com',
    cv_url: '#',
  },
  {
    id: 'cand-5',
    name: 'Sara Williams',
    summary: 'UI engineer comfortable translating ambiguous requirements into crisp interfaces.',
    matchDescription: 'Strong fit for frontend ownership and stakeholder-facing workflows.',
    phone: '+1 555 0105',
    email: 'sara.williams@example.com',
    cv_url: '#',
  },
];

let pools: JobPool[] = [
  {
    id: 'pool-1',
    public_slug: 'frontend-engineer',
    title: 'Frontend Engineer',
    company_name: 'xQuesty',
    status: 'active',
    created_at: '2026-06-01T10:00:00.000Z',
    applicant_count: 2,
    main_mission: 'Build polished recruiter-facing interfaces for candidate matching.',
    location: 'Remote',
    contract_type: 'Full-time',
    experience_level: 'Mid-Level',
    education_level: 'Bachelor preferred',
    language: 'English',
    salary_range: '$90k - $120k',
    description: 'Own frontend workflows across search, job pools, and candidate review.',
    required_skills: ['React', 'TypeScript', 'Next.js'],
  },
];

const applicants: Record<string, StudentApplicant[]> = {
  'pool-1': [
    {
      id: 'app-1',
      student_name: 'Maya Chen',
      student_email: 'maya.chen@example.com',
      status: 'reviewing',
      interview_status: 'completed',
      joined_at: '2026-06-08T14:30:00.000Z',
    },
    {
      id: 'app-2',
      student_name: 'Adam Rivera',
      student_email: 'adam.rivera@example.com',
      status: 'applied',
      interview_status: 'in_progress',
      joined_at: '2026-06-10T09:15:00.000Z',
    },
  ],
};

export function getCreditBalance() {
  return 12;
}

export function searchCandidates(jobDescription: string) {
  const searchId = `search-${Date.now()}`;
  const query = jobDescription.trim();

  return {
    searchId,
    candidates: demoCandidates.map((candidate) => ({
      ...candidate,
      matchDescription: candidate.matchDescription || `Relevant to: ${query}`,
    })),
  };
}

export function getSearchHistory(): SearchHistoryItem[] {
  return [
    {
      id: 'demo-search-1',
      queryDescription: 'Frontend engineer with React, TypeScript, dashboard, and UX experience.',
      createdAt: '2026-06-12T11:20:00.000Z',
      topCount: 5,
      unlockedCount: 5,
    },
  ];
}

export function getSearchHistoryDetails(searchId: string) {
  return { searchId, candidates: demoCandidates };
}

export function listPools() {
  return [...pools];
}

export function getPool(poolId: string) {
  return pools.find((pool) => pool.id === poolId) || null;
}

export function getPublicPool(slug: string) {
  return pools.find((pool) => pool.public_slug === slug) || pools[0] || null;
}

export function listApplicants(poolId: string) {
  return applicants[poolId] || [];
}

export function createPool(payload: Partial<JobPool>) {
  const id = `pool-${Date.now()}`;
  const title = payload.title || 'Untitled Pool';
  const pool: JobPool = {
    id,
    public_slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id,
    title,
    company_name: demoUser.companyName,
    status: 'active',
    created_at: new Date().toISOString(),
    applicant_count: 0,
    main_mission: payload.main_mission,
    description: payload.description,
    required_skills: payload.required_skills,
  };

  pools = [pool, ...pools];
  return pool;
}

export function setPoolStatus(poolId: string, status: JobPool['status']) {
  pools = pools.map((pool) => (pool.id === poolId ? { ...pool, status } : pool));
  return getPool(poolId);
}

export function deletePool(poolId: string) {
  pools = pools.filter((pool) => pool.id !== poolId);
}

export function publicPoolUrl(slug: string) {
  if (typeof window === 'undefined') return `/pool/${slug}`;
  return `${window.location.origin}/pool/${slug}`;
}
