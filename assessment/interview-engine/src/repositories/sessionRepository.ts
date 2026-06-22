import { supabase } from "../lib/supabase.js";
import { tables } from "../lib/tables.js";
import { SessionState, SessionRow } from "../types/interview.js";
import { prefixedId } from "../utils/id.js";

interface CreateSessionInput {
  candidateId: string;
  templateId: string;
  state: SessionState;
}

export class SessionRepository {
  async create(input: CreateSessionInput): Promise<SessionRow> {
    const id = prefixedId("sess");
    const payload = {
      id,
      candidate_id: input.candidateId,
      template_id: input.templateId,
      status: "in_progress",
      current_stage: input.state.stage,
      turn_count: input.state.turn_count,
      compact_summary_json: input.state.summary,
      slot_state_json: input.state.slots,
      asked_question_ids_json: input.state.asked_questions,
    };

    const { data, error } = await supabase
      .from(tables.sessions)
      .insert(payload)
      .select(
        "id, candidate_id, template_id, status, current_stage, turn_count, compact_summary_json, slot_state_json, asked_question_ids_json",
      )
      .single<SessionRow>();

    if (error || !data) {
      throw new Error(`Failed to create session: ${error?.message ?? "unknown"}`);
    }
    return data;
  }

  async getById(sessionId: string): Promise<SessionRow> {
    const { data, error } = await supabase
      .from(tables.sessions)
      .select(
        "id, candidate_id, template_id, status, current_stage, turn_count, compact_summary_json, slot_state_json, asked_question_ids_json",
      )
      .eq("id", sessionId)
      .single<SessionRow>();

    if (error || !data) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return data;
  }

  async updateState(sessionId: string, state: SessionState, status?: SessionRow["status"]): Promise<void> {
    const patch = {
      current_stage: state.stage,
      turn_count: state.turn_count,
      compact_summary_json: state.summary,
      slot_state_json: state.slots,
      asked_question_ids_json: state.asked_questions,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(tables.sessions).update(patch).eq("id", sessionId);
    if (error) throw new Error(`Failed to update session ${sessionId}: ${error.message}`);
  }
}
