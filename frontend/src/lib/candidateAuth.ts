import { apiRequest, getToken as getSharedToken, removeToken, setToken } from './auth';

const TOKEN_KEY = 'candidate_token';
const REFRESH_KEY = 'candidate_refresh_token';

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
  cv_url: string | null;
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
  refresh_token?: string | null;
  token_type: string;
  candidate: Candidate;
}

function storeTokens(access: string, refresh?: string | null): void {
  setToken(TOKEN_KEY, access);
  if (refresh) setToken(REFRESH_KEY, refresh);
}

export function getToken(): string | null {
  return getSharedToken(TOKEN_KEY);
}

export function logout(): void {
  removeToken(TOKEN_KEY);
  removeToken(REFRESH_KEY);
}

export async function registerCandidate(payload: RegisterPayload): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  storeTokens(data.access_token, data.refresh_token);
  return data.candidate;
}

export async function loginCandidate(email: string, password: string): Promise<Candidate> {
  const data = await apiRequest<TokenResponse>('/api/candidate/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  storeTokens(data.access_token, data.refresh_token);
  return data.candidate;
}

/** Exchange the stored refresh_token for a fresh access_token. Returns success. */
export async function refreshCandidateToken(): Promise<boolean> {
  const refresh = getSharedToken(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const data = await apiRequest<{ access_token?: string; refresh_token?: string | null }>(
      '/api/candidate/refresh',
      { method: 'POST', body: JSON.stringify({ refresh_token: refresh }) },
    );
    if (!data.access_token) return false;
    storeTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentCandidate(): Promise<Candidate> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  try {
    return await apiRequest<Candidate>('/api/candidate/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    // Access token likely expired → try a silent refresh once, then retry.
    if ((e as { status?: number })?.status === 401 && (await refreshCandidateToken())) {
      return apiRequest<Candidate>('/api/candidate/me', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    }
    throw e;
  }
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

export async function changeCandidatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  await apiRequest('/api/candidate/password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export interface CvInfo {
  cv_url: string | null;
  name?: string;
  size?: number;
  updated_at?: string;
}

export interface AiRecommendation {
  pool_id: string;
  score: number;
  reason: string;
}
export interface RecommendationsResult {
  recommendations: AiRecommendation[];
  used_ai: boolean;
  used_cv: boolean;
}

/** AI-ranked offer recommendations (profile + CV via OpenAI). Longer timeout. */
export async function getRecommendations(): Promise<RecommendationsResult> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    return await apiRequest<RecommendationsResult>('/api/candidate/recommendations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Current CV (read from storage — the source of truth). */
export async function getCv(signal?: AbortSignal): Promise<CvInfo> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return apiRequest<CvInfo>('/api/candidate/cv', {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
}

/** Upload a CV with real upload progress (XHR). Returns the stored CV info. */
export function uploadCv(file: File, onProgress?: (pct: number) => void): Promise<CvInfo> {
  const token = getToken();
  if (!token) return Promise.reject(new Error('Not authenticated'));
  const API_URL = import.meta.env.VITE_API_URL || '';

  return new Promise<CvInfo>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/candidate/cv`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CvInfo);
        } catch {
          resolve({ cv_url: null });
        }
      } else {
        let msg = `Échec du téléversement (${xhr.status})`;
        try {
          const b = JSON.parse(xhr.responseText);
          if (typeof b.detail === 'string') msg = b.detail;
        } catch {
          /* keep default */
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Échec du téléversement (réseau).'));
    xhr.send(form);
  });
}

/** Remove the candidate's CV. */
export async function deleteCv(): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  await apiRequest('/api/candidate/cv', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
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
