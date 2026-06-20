export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
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
}

export interface StudentApplicant {
  id: string;
  student_name?: string;
  student_email?: string;
  status?: string;
  interview_status?: string;
  joined_at?: string;
}
