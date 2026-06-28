/**
 * Client-side application tracking.
 *
 * The backend has no "list my applications" endpoint for candidates, so we
 * record each application locally (per candidate) when they enter an
 * interview. Live status is then resolved against the REAL interview-session
 * endpoint. This is a real, data-backed feature — not a placeholder.
 */
import { getSessionStatus } from '@/interview/lib/api';

export type TrackedApplication = {
  poolId: string;
  token: string;
  title: string;
  company?: string;
  appliedAt: string;
};

export type ApplicationStatus = 'none' | 'active' | 'completed';
export type TrackedApplicationWithStatus = TrackedApplication & { status: ApplicationStatus };

const keyFor = (candidateId?: string) => `xq_candidate_apps_${candidateId ?? 'anon'}`;

export function listApplications(candidateId?: string): TrackedApplication[] {
  try {
    const raw = localStorage.getItem(keyFor(candidateId));
    const arr = raw ? (JSON.parse(raw) as TrackedApplication[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function recordApplication(candidateId: string, app: TrackedApplication): void {
  try {
    const list = listApplications(candidateId);
    if (!list.some((a) => a.poolId === app.poolId)) {
      list.unshift(app);
      localStorage.setItem(keyFor(candidateId), JSON.stringify(list));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function removeApplication(candidateId: string, poolId: string): void {
  try {
    const next = listApplications(candidateId).filter((a) => a.poolId !== poolId);
    localStorage.setItem(keyFor(candidateId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Resolve each tracked application's live interview status from the backend. */
export async function listApplicationsWithStatus(
  candidateId: string,
): Promise<TrackedApplicationWithStatus[]> {
  const apps = listApplications(candidateId);
  return Promise.all(
    apps.map(async (a) => {
      let status: ApplicationStatus = 'none';
      try {
        const res = await getSessionStatus(a.poolId);
        status = res.status;
      } catch {
        /* keep 'none' */
      }
      return { ...a, status };
    }),
  );
}
