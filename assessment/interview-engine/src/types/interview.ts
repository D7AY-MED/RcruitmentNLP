export const QUESTION_TYPES = [
  "single_choice",
  "multi_choice",
  "dropdown",
  "short_text",
  "long_text",
  "numeric",
  "date",
  "boolean",
  "multi_part",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export type SlotStatus = "missing" | "partial" | "filled" | "verified";

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface QuestionField {
  key: string;
  type: Exclude<QuestionType, "multi_part">;
  label: string;
  required: boolean;
  options?: ChoiceOption[];
  placeholder?: string;
  help_text?: string;
  min?: number;
  max?: number;
  max_length?: number;
  allow_other?: boolean;
  other_label?: string;
  validation_regex?: string;
  store_as?: string;
}

export interface QuestionBlock {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: ChoiceOption[];
  fields?: QuestionField[];
  placeholder?: string;
  min?: number;
  max?: number;
  max_length?: number;
}

export interface SlotState {
  status: SlotStatus;
  value: unknown;
  confidence: number;
}

export interface CompletionRules {
  mandatorySlotsRemaining: number;
  maxTurns: number;
}

export interface SessionState {
  stage: string;
  slots: Record<string, SlotState>;
  summary: Record<string, unknown>;
  asked_questions: string[];
  turn_count: number;
  completion_rules: CompletionRules;
  confidence_by_competency: Record<string, number>;
}

export interface TemplateConfig {
  role: string;
  stages: string[];
  phasePlan?: Array<{
    stage: string;
    objective: string;
    targetQuestions: number;
  }>;
  mandatorySlots: string[];
  competencies: string[];
  allowedQuestionTypes: QuestionType[];
  maxTurns: number;
  tone?: string;
  objective?: string;
}

export interface InterviewTemplate {
  id: string;
  role: string;
  config: TemplateConfig;
}

export interface SessionCompletion {
  should_end: boolean;
  reason: string | null;
}

export interface StateUpdatePatch {
  slots_completed?: string[];
  slots_pending?: string[];
  confidence_updates?: Record<string, number>;
  signals?: Record<string, unknown>;
}

export interface NextQuestionOutput {
  stage: string;
  objective: string;
  state_updates: StateUpdatePatch;
  question: QuestionBlock;
  completion: SessionCompletion;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface TurnTelemetry {
  model: string;
  latencyMs: number;
  tokenUsage: TokenUsage;
}

export interface NextQuestionResult {
  question: QuestionBlock;
  updatedState: SessionState;
  completion: SessionCompletion;
  telemetry: TurnTelemetry;
}

export interface FinalReportCompetency {
  name: string;
  score: number;
  confidence: number;
  evidence: string[];
}

export interface FinalReport {
  candidateId: string;
  sessionId: string;
  role: string;
  summary: string;
  competencies: FinalReportCompetency[];
  motivation: {
    strength: "low" | "medium" | "high";
    notes: string;
  };
  communicationNotes: {
    clarity: "low" | "medium" | "high";
    confidence: "low" | "medium" | "high";
    professionalism: "low" | "medium" | "high";
    notes: string;
  };
  redFlags: string[];
  recommendation: "reject" | "maybe" | "shortlist" | "strong_shortlist";
}

export interface SessionRow {
  id: string;
  candidate_id: string;
  template_id: string;
  status: "in_progress" | "completed" | "failed";
  current_stage: string;
  turn_count: number;
  compact_summary_json: Record<string, unknown>;
  slot_state_json: Record<string, SlotState>;
  asked_question_ids_json: string[];
}

export interface TurnRow {
  id: string;
  session_id: string;
  question_id: string;
  question_json: QuestionBlock;
  answer_raw_json: Record<string, unknown> | null;
  answer_normalized_json: Record<string, unknown> | null;
  extracted_signals_json: Record<string, unknown> | null;
  latency_ms: number | null;
  token_usage_json: Record<string, unknown> | null;
  created_at: string;
}
