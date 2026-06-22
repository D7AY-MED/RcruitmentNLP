import { QuestionBlock, SessionCompletion, SessionState, SlotState, StateUpdatePatch, TemplateConfig } from "../types/interview.js";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function computeMandatoryRemaining(slots: Record<string, SlotState>, mandatorySlots: string[]): number {
  return mandatorySlots.filter((slot) => {
    const state = slots[slot];
    return !state || (state.status !== "filled" && state.status !== "verified");
  }).length;
}

export class StateManager {
  initialize(template: TemplateConfig): SessionState {
    const maxTurns = template.maxTurns || 14;
    const slots: Record<string, SlotState> = {};
    for (const slot of template.mandatorySlots || []) {
      slots[slot] = { status: "missing", value: null, confidence: 0 };
    }
    const confidenceByCompetency: Record<string, number> = {};
    for (const competency of template.competencies || []) {
      confidenceByCompetency[competency] = 0;
    }
    const firstStage = template.phasePlan?.[0]?.stage ?? template.stages?.[0] ?? "phase_1_profile_experience";
    return {
      stage: firstStage,
      slots,
      summary: {},
      asked_questions: [],
      turn_count: 0,
      completion_rules: {
        mandatorySlotsRemaining: computeMandatoryRemaining(slots, template.mandatorySlots || []),
        maxTurns,
      },
      confidence_by_competency: confidenceByCompetency,
    };
  }

  fromSessionRow(
    summary: Record<string, unknown>,
    slots: Record<string, SlotState>,
    askedQuestions: string[],
    turnCount: number,
    stage: string,
    template: TemplateConfig,
  ): SessionState {
    const mandatorySlots = template.mandatorySlots || [];
    return {
      stage,
      slots,
      summary,
      asked_questions: askedQuestions,
      turn_count: turnCount,
      completion_rules: {
        mandatorySlotsRemaining: computeMandatoryRemaining(slots, mandatorySlots),
        maxTurns: template.maxTurns || 14,
      },
      confidence_by_competency: {},
    };
  }

  applyAnswer(state: SessionState, question: QuestionBlock, answer: Record<string, unknown>): SessionState {
    const next = structuredClone(state);
    next.turn_count += 1;
    next.summary.last_answer = answer;
    next.summary.last_question_id = question.id;

    for (const [key, value] of Object.entries(answer)) {
      if (next.slots[key]) {
        next.slots[key] = {
          status: value === null || value === "" ? "partial" : "filled",
          value,
          confidence: value === null || value === "" ? 0.3 : 0.7,
        };
      }
    }

    if (question.id in next.slots && Object.keys(answer).length > 0) {
      next.slots[question.id] = {
        status: "filled",
        value: answer,
        confidence: 0.7,
      };
    }
    return next;
  }

  applyModelUpdates(state: SessionState, patch: StateUpdatePatch, template: TemplateConfig): SessionState {
    const next = structuredClone(state);
    for (const slot of patch.slots_completed || []) {
      next.slots[slot] = {
        status: "filled",
        value: next.slots[slot]?.value ?? true,
        confidence: Math.max(next.slots[slot]?.confidence ?? 0, 0.75),
      };
    }
    for (const slot of patch.slots_pending || []) {
      next.slots[slot] = {
        status: next.slots[slot]?.status ?? "missing",
        value: next.slots[slot]?.value ?? null,
        confidence: next.slots[slot]?.confidence ?? 0,
      };
    }
    for (const [competency, confidence] of Object.entries(patch.confidence_updates || {})) {
      next.confidence_by_competency[competency] = clamp01(confidence);
    }
    if (patch.signals) {
      next.summary.signals = {
        ...(typeof next.summary.signals === "object" && next.summary.signals !== null
          ? (next.summary.signals as Record<string, unknown>)
          : {}),
        ...patch.signals,
      };
    }
    next.completion_rules.mandatorySlotsRemaining = computeMandatoryRemaining(
      next.slots,
      template.mandatorySlots || [],
    );
    return next;
  }

  markQuestionAsked(state: SessionState, questionId: string, stage: string): SessionState {
    const next = structuredClone(state);
    next.stage = stage;
    if (!next.asked_questions.includes(questionId)) {
      next.asked_questions.push(questionId);
    }
    return next;
  }

  shouldComplete(state: SessionState, modelCompletion: SessionCompletion): SessionCompletion {
    if (state.turn_count >= state.completion_rules.maxTurns) {
      return { should_end: true, reason: "max_questions_reached" };
    }
    if (state.completion_rules.mandatorySlotsRemaining === 0 && state.turn_count >= 6) {
      return { should_end: true, reason: "mandatory_slots_filled" };
    }
    return modelCompletion;
  }

  progressPercent(state: SessionState, template: TemplateConfig): number {
    const mandatory = template.mandatorySlots || [];
    if (mandatory.length === 0) return Math.min(100, Math.round((state.turn_count / state.completion_rules.maxTurns) * 100));
    const done = mandatory.length - state.completion_rules.mandatorySlotsRemaining;
    return Math.min(100, Math.round((done / mandatory.length) * 100));
  }
}
