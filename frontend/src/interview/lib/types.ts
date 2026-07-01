export type InterviewStatus = 'idle' | 'active' | 'completed';

export type StartMeta = {
  sessionId: string;
  status: string;
};

export type StartDone = {
  sessionId: string;
  responseId: string;
  question: string;
  status: string;
  totalQuestions?: number;
};

export type NextDone = {
  completed: boolean;
  responseId: string;
  sessionId: string;
  question?: string;
  status: string;
  totalQuestions?: number;
};

export type DeltaPayload = {
  delta: string;
};

export type ErrorPayload = {
  error: string;
};

export type SessionStatus =
  | { status: 'none' }
  | { status: 'completed' }
  | { status: 'active'; sessionId: string; responseId: string; question: string; sequence: number; totalQuestions?: number };

