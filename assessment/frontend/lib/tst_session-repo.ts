import { randomUUID } from "node:crypto";

export type TstInterviewStatus = "active" | "completed";

export type TstInterviewSession = {
  id: string;
  candidate_name: string;
  latest_response_id: string;
  question_count: number;
  status: TstInterviewStatus;
  created_at: string;
  updated_at: string;
};

const sessions = new Map<string, TstInterviewSession>();

export async function createTstInterviewSession(input: {
  candidateName: string;
  latestResponseId: string;
}): Promise<TstInterviewSession> {
  const now = new Date().toISOString();
  const session: TstInterviewSession = {
    id: randomUUID(),
    candidate_name: input.candidateName,
    latest_response_id: input.latestResponseId,
    question_count: 1,
    status: "active",
    created_at: now,
    updated_at: now
  };
  sessions.set(session.id, session);
  return session;
}

export async function getTstInterviewSessionById(
  id: string
): Promise<TstInterviewSession | null> {
  return sessions.get(id) ?? null;
}

export async function updateTstInterviewSession(input: {
  id: string;
  latestResponseId: string;
  questionCount: number;
  status?: TstInterviewStatus;
}): Promise<TstInterviewSession> {
  const existing = sessions.get(input.id);
  if (!existing) {
    throw new Error("Session not found.");
  }

  const updated: TstInterviewSession = {
    ...existing,
    latest_response_id: input.latestResponseId,
    question_count: input.questionCount,
    status: input.status ?? existing.status,
    updated_at: new Date().toISOString()
  };

  sessions.set(input.id, updated);
  return updated;
}
