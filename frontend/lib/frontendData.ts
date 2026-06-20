import { AuthUser, JobPool, StudentApplicant } from '@/lib/types';
import { createJobPool, listJobPools, getJobPool, updateJobPoolStatus, deleteJobPool, getPublicJobPool } from './jobPoolService';

export { createJobPool, listJobPools, getJobPool, updateJobPoolStatus, deleteJobPool, getPublicJobPool };

export const demoUser: AuthUser = {
  id: 'demo-recruiter',
  email: 'recruiter@example.com',
  fullName: 'Demo Recruiter',
  companyName: 'xQuesty',
};

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
  if (typeof window === 'undefined') return `/apply/${slug}`;
  return `${window.location.origin}/apply/${slug}`;
}
