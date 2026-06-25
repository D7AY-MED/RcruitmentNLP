import { AuthUser, Candidate, JobPool, SearchHistoryItem, StudentApplicant } from '@/lib/types';
import { createJobPool, listJobPools, getJobPool, updateJobPoolStatus, deleteJobPool, getPublicJobPool } from './jobPoolService';

export { createJobPool, listJobPools, getJobPool, updateJobPoolStatus, deleteJobPool, getPublicJobPool };

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

let pools: JobPool[] = [];

const applicants: Record<string, StudentApplicant[]> = {};

export function getCreditBalance() {
  return 12;
}

export function searchCandidates(jobDescription: string) {
  const searchId = `search-${Date.now()}`;
  return {
    searchId,
    candidates: [],
  };
}

export function getSearchHistory(): SearchHistoryItem[] {
  return [];
}

export function getSearchHistoryDetails(searchId: string) {
  return { searchId, candidates: [] };
}

export function listPools() {
  return [...pools];
}

export function getPool(poolId: string) {
  return pools.find((pool) => pool.id === poolId) || null;
}

export function getPublicPool(slug: string) {
  return pools.find((pool) => pool.public_slug === slug) || null;
}

export function listPublicPoolsMock() {
  return pools.filter((pool) => pool.status === 'active');
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
