import { apiRequest, getToken as getSharedToken, removeToken, setToken } from './auth';

const TOKEN_KEY = 'candidate_token';

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  current_job_title: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  city: string | null;
  education_level: string | null;
  university_name: string | null;
  field_of_study: string | null;
  languages: string[] | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  profile_picture_url: string | null;
  open_to_work: boolean | null;
  created_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  candidate: Candidate;
}

export function getToken(): string | null {
  return getSharedToken(TOKEN_KEY);
}

export function logout(): void {
  removeToken(TOKEN_KEY);
}

export async function registerCandidate(payload: RegisterPayload): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.candidate;
}

export async function loginCandidate(email: string, password: string): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.candidate;
}

export async function getCurrentCandidate(): Promise<Candidate> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Candidate>('/api/candidate/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateCandidateProfile(data: Partial<Candidate>): Promise<Candidate> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Candidate>('/api/candidate/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function uploadProfilePicture(file: File): Promise<Candidate> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const API_URL = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${API_URL}/api/candidate/profile/picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.detail === 'string' ? body.detail : `Upload failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<Candidate>;
}
