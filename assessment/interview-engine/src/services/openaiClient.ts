import OpenAI from "openai";
import { env } from "../config/env.js";
import { NextQuestionOutputSchema, FinalReportSchema } from "../schemas/interview.js";
import {
  FinalReport,
  NextQuestionOutput,
  QuestionBlock,
  SessionState,
  TemplateConfig,
  TurnTelemetry,
} from "../types/interview.js";

interface NextQuestionInput {
  template: TemplateConfig;
  state: SessionState;
  latestAnswer: Record<string, unknown> | null;
  lastQuestion: QuestionBlock | null;
}

const client = new OpenAI({ apiKey: env.openaiApiKey });

export class OpenAIClient {
  async generateNextQuestion(input: NextQuestionInput): Promise<{ output: NextQuestionOutput; telemetry: TurnTelemetry }> {
    const startedAt = Date.now();
    const response = await client.chat.completions.create({
      model: env.openaiFastModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an ultra-fast adaptive interview engine. Return valid JSON only, no markdown. Ask deep, personalized follow-ups from the first question. Never repeat already asked questions. Do not use static question templates. Use only phase objectives and current evidence to decide next question.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Generate the next adaptive interview question and state updates",
            rules: {
              allowedQuestionTypes: input.template.allowedQuestionTypes,
              maxSubFieldsForMultiPart: 4,
              avoidLongTextWhenPossible: true,
              noDuplicateQuestionIds: input.state.asked_questions,
              returnShape: "stage, objective, state_updates, question, completion",
              firstQuestionMustProfileCandidateQuickly: true,
              userFriendlyAndConcise: true,
            },
            template: {
              role: input.template.role,
              stages: input.template.stages,
              phasePlan: input.template.phasePlan ?? [],
              mandatorySlots: input.template.mandatorySlots,
              competencies: input.template.competencies,
              tone: input.template.tone || "professional",
              objective: input.template.objective || "Run a fully adaptive assessment with high signal and low friction.",
            },
            state: input.state,
            latestAnswer: input.latestAnswer,
            lastQuestion: input.lastQuestion,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = await this.repairNextQuestion(raw, input);
    }

    const validated = NextQuestionOutputSchema.safeParse(parsed);
    if (!validated.success) {
      const repaired = await this.repairNextQuestion(raw, input);
      const repairedValidated = NextQuestionOutputSchema.parse(repaired);
      return {
        output: repairedValidated,
        telemetry: {
          model: env.openaiFastModel,
          latencyMs: Date.now() - startedAt,
          tokenUsage: {
            input: response.usage?.prompt_tokens ?? 0,
            output: response.usage?.completion_tokens ?? 0,
          },
        },
      };
    }

    return {
      output: validated.data,
      telemetry: {
        model: env.openaiFastModel,
        latencyMs: Date.now() - startedAt,
        tokenUsage: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
      },
    };
  }

  private async repairNextQuestion(raw: string, input: NextQuestionInput): Promise<unknown> {
    const response = await client.chat.completions.create({
      model: env.openaiFastModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You repair invalid JSON into the required interview schema. Return JSON only and keep semantics.",
        },
        {
          role: "user",
          content: JSON.stringify({
            invalid_output: raw,
            required_shape: {
              stage: "string",
              objective: "string",
              state_updates: {
                slots_completed: "string[]",
                slots_pending: "string[]",
                confidence_updates: "Record<string, number 0..1>",
                signals: "Record<string, unknown>",
              },
              question: "Question object with supported question types",
              completion: {
                should_end: "boolean",
                reason: "string | null",
              },
            },
            supported_question_types: input.template.allowedQuestionTypes,
            must_keep_adaptive_behavior: true,
          }),
        },
      ],
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  }

  async generateFinalReport(params: {
    candidateId: string;
    sessionId: string;
    template: TemplateConfig;
    state: SessionState;
    evidence: Array<{ questionId: string; answer: Record<string, unknown> | null }>;
  }): Promise<FinalReport> {
    const response = await client.chat.completions.create({
      model: env.openaiReportModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a recruiter-assessment assistant. Return concise, evidence-based, structured JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            candidateId: params.candidateId,
            sessionId: params.sessionId,
            role: params.template.role,
            competencies: params.template.competencies,
            summaryState: params.state.summary,
            slotState: params.state.slots,
            evidence: params.evidence,
            output_contract: {
              candidateId: "string",
              sessionId: "string",
              role: "string",
              summary: "string (concise recruiter summary)",
              competencies: "array: {name, score 0..5, confidence 0..1, evidence[]}",
              motivation: {
                strength: "low|medium|high",
                notes: "string",
              },
              communicationNotes: {
                clarity: "low|medium|high",
                confidence: "low|medium|high",
                professionalism: "low|medium|high",
                notes: "string",
              },
              redFlags: "string[]",
              recommendation: "reject|maybe|shortlist|strong_shortlist",
            },
          }),
        },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return FinalReportSchema.parse(parsed);
  }
}
