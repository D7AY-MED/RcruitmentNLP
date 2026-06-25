export interface HRProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface HRSearch {
  id: string;
  hr_profile_id: string;
  job_description: string;
  top_5_results_ids: string[];
  created_at: string;
}

export interface UnlockLedger {
  id: string;
  hr_profile_id: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface UnlockedCandidate {
  id: string;
  ledger_id: string;
  candidate_id: string;
  created_at: string;
}

export interface HRBalance {
  hr_profile_id: string;
  balance: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  companyDescription?: string;
  companyIndustry?: string;
  companySize?: string;
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyFoundedYear?: number;
  avatarUrl?: string;
}

export interface Candidate {
  id: string;
  name: string;
  summary: string;
  matchDescription?: string;
  phone?: string;
  email?: string;
  cv_url?: string;
}

export interface SearchHistoryItem {
  id: string;
  queryDescription: string;
  createdAt: string;
  topCount: number;
  unlockedCount: number;
}

export interface JobPool {
  id: string;
  public_slug: string;
  title: string;
  company_name?: string;
  status: 'active' | 'disabled' | 'archived';
  created_at: string;
  applicant_count?: number;
  main_mission?: string;
  location?: string;
  contract_type?: string;
  experience_level?: string;
  education_level?: string;
  language?: string;
  salary_range?: string;
  deadline?: string;
  description?: string;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  soft_skills?: string[];
  deal_breakers?: string[];
  responsibilities?: string[];
  notes?: string;
  gemini_store_name?: string;
}

export interface StudentApplicant {
  id: string;
  student_name?: string;
  student_email?: string;
  status?: string;
  interview_status?: string;
  joined_at?: string;
}
