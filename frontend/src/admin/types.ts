/**
 * Shared TypeScript contracts for the admin module.
 *
 * These mirror the FastAPI admin responses (app/admin/schemas). Keeping them in
 * one place means a backend field change is fixed in exactly one frontend file.
 */

export type UserType = "candidate" | "recruiter";

/** Server-side pagination envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface AdminTokenResponse {
  access_token: string;
  token_type: string;
  admin: Admin;
}

/** Row in the unified Users table (candidate or recruiter). */
export interface UserRow {
  id: string;
  type: UserType;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string | null;
  disabled: boolean;
  /** Present only on the detail endpoint: the full underlying profile row. */
  profile?: Record<string, any>;
}

export interface AdminStats {
  recruiters: number;
  candidates: number;
  pools: number;
  activePools: number;
  companies: number;
  applications: number;
  completedApplications: number;
  summaries: number;
}

export interface DashboardCharts {
  growth: { month: string; candidates: number; recruiters: number }[];
  applicationStatus: { name: string; value: number }[];
  poolsState: { name: string; value: number }[];
  topCompanies: { name: string; value: number }[];
}

export interface ActivityItem {
  type: "candidate" | "recruiter" | "job" | "application";
  title: string;
  subtitle?: string | null;
  timestamp?: string | null;
}

export interface Company {
  key: string;
  company_name: string;
  recruiters: number;
  jobs: number;
  members: { id: string; full_name: string | null; email: string | null }[];
  company_description?: string | null;
  company_industry?: string | null;
  company_size?: string | null;
  company_website?: string | null;
  company_linkedin_url?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  company_founded_year?: number | null;
  pools?: Job[];
  created_at?: string | null;
}

export interface Job {
  id: string;
  title: string | null;
  description?: string | null;
  company_name: string | null;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  location: string | null;
  contract_type: string | null;
  seniority_level: string | null;
  experience_range?: string | null;
  education_level?: string | null;
  years_experience?: number | null;
  status: boolean;
  archived: boolean;
  main_mission?: string | null;
  notes?: string | null;
  languages?: string[] | null;
  responsibilities?: string[] | null;
  must_have_skills?: string[] | null;
  nice_to_have_skills?: string[] | null;
  soft_skills?: string[] | null;
  deal_breakers?: string[] | null;
  public_token?: string | null;
  created_at: string | null;
}

export interface ApplicationRow {
  session_id: string;
  candidate_id: string;
  candidate_name: string | null;
  pool_id: string | null;
  pool_title: string | null;
  phone: string | null;
  status: "active" | "completed";
  total_questions: number;
  answered: number;
  started_at: string | null;
  updated_at: string | null;
}

export interface ApplicationDetail {
  session_id: string;
  candidate: Record<string, any> | null;
  candidate_name: string | null;
  pool: Job | null;
  pool_title: string | null;
  status: "active" | "completed";
  answered: number;
  total_questions: number;
  summary: { summary?: string; score?: string; last_updated?: string } | null;
  questions: { sequence: number; question: string; answer: string | null; timestamp: string | null }[];
}

export interface ReportSummary {
  totals: {
    candidates: number;
    recruiters: number;
    companies: number;
    jobs: number;
    activeJobs: number;
    archivedJobs: number;
    applications: number;
    completedApplications: number;
  };
  rates: { interviewCompletionRate: number; openToWorkCandidates: number };
  topCompanies: Company[];
}
