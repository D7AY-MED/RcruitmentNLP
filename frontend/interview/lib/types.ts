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
};

export type NextDone = {
  completed: boolean;
  responseId: string;
  sessionId: string;
  question?: string;
  status: string;
};

export type DeltaPayload = {
  delta: string;
};

export type ErrorPayload = {
  error: string;
};
