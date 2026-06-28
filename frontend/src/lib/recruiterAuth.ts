import { apiRequest, getToken as getSharedToken, removeToken, setToken } from './auth';

const TOKEN_KEY = 'recruiter_token';

export interface Recruiter {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  phone: string | null;
  created_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  phone?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  recruiter: Recruiter;
}

export function getToken(): string | null {
  return getSharedToken(TOKEN_KEY);
}

export function logout(): void {
  removeToken(TOKEN_KEY);
}

export async function registerRecruiter(payload: RegisterPayload): Promise<Recruiter> {
  const data = await apiRequest<TokenResponse>('/api/v1/recruiter/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.recruiter;
}

export async function loginRecruiter(email: string, password: string): Promise<Recruiter> {
  const data = await apiRequest<TokenResponse>('/api/v1/recruiter/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(TOKEN_KEY, data.access_token);
  return data.recruiter;
}

export async function getCurrentRecruiter(): Promise<Recruiter> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<Recruiter>('/api/v1/recruiter/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function changeRecruiterPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  await apiRequest<{ ok: boolean }>('/api/v1/recruiter/password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}
