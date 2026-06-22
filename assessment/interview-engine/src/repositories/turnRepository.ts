import { supabase } from "../lib/supabase.js";
import { tables } from "../lib/tables.js";
import { QuestionBlock, TurnRow } from "../types/interview.js";
import { prefixedId } from "../utils/id.js";

interface CreateTurnInput {
  sessionId: string;
  questionId: string;
  question: QuestionBlock;
  answerRaw?: Record<string, unknown> | null;
  answerNormalized?: Record<string, unknown> | null;
  extractedSignals?: Record<string, unknown> | null;
  latencyMs?: number;
  tokenUsage?: Record<string, unknown>;
}

export class TurnRepository {
  async create(input: CreateTurnInput): Promise<TurnRow> {
    const id = prefixedId("turn");
    const payload = {
      id,
      session_id: input.sessionId,
      question_id: input.questionId,
      question_json: input.question,
      answer_raw_json: input.answerRaw ?? null,
      answer_normalized_json: input.answerNormalized ?? null,
      extracted_signals_json: input.extractedSignals ?? null,
      latency_ms: input.latencyMs ?? null,
      token_usage_json: input.tokenUsage ?? null,
    };

    const { data, error } = await supabase.from(tables.turns).insert(payload).select("*").single<TurnRow>();
    if (error || !data) {
      throw new Error(`Failed to create turn: ${error?.message ?? "unknown"}`);
    }
    return data;
  }

  async patchAnswerByQuestion(sessionId: string, questionId: string, answer: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from(tables.turns)
      .update({
        answer_raw_json: answer,
        answer_normalized_json: answer,
      })
      .eq("session_id", sessionId)
      .eq("question_id", questionId)
      .is("answer_raw_json", null);
    if (error) throw new Error(`Failed to patch turn answer: ${error.message}`);
  }

  async getLastBySession(sessionId: string): Promise<TurnRow | null> {
    const { data, error } = await supabase
      .from(tables.turns)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<TurnRow>();

    if (error) throw new Error(`Failed to get last turn: ${error.message}`);
    return data ?? null;
  }

  async listBySession(sessionId: string, limit = 20): Promise<TurnRow[]> {
    const { data, error } = await supabase
      .from(tables.turns)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit)
      .returns<TurnRow[]>();
    if (error) throw new Error(`Failed to list turns: ${error.message}`);
    return data ?? [];
  }
}
