import { ReportRepository } from "../repositories/reportRepository.js";
import { SessionRepository } from "../repositories/sessionRepository.js";
import { TemplateRepository } from "../repositories/templateRepository.js";
import { TurnRepository } from "../repositories/turnRepository.js";
import { SessionStateSchema } from "../schemas/interview.js";
import { FinalReport, QuestionBlock } from "../types/interview.js";
import { NextQuestionGenerator } from "./nextQuestionGenerator.js";
import { ReportGenerator } from "./reportGenerator.js";
import { StateManager } from "./stateManager.js";

export class InterviewEngine {
  private static readonly DEFAULT_TEMPLATE_ID = "tmpl_dynamic_assessment_v1";

  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly turnRepo: TurnRepository,
    private readonly reportRepo: ReportRepository,
    private readonly stateManager: StateManager,
    private readonly nextQuestionGenerator: NextQuestionGenerator,
    private readonly reportGenerator: ReportGenerator,
  ) {}

  async start(candidateId: string, templateId?: string): Promise<{
    sessionId: string;
    status: string;
    question: QuestionBlock;
    progress: { stage: string; turnCount: number; percent: number };
  }> {
    const resolvedTemplateId = templateId || InterviewEngine.DEFAULT_TEMPLATE_ID;
    const template = await this.templateRepo.getById(resolvedTemplateId);
    let state = this.stateManager.initialize(template.config);
    const session = await this.sessionRepo.create({ candidateId, templateId: resolvedTemplateId, state });

    const next = await this.nextQuestionGenerator.generate({
      template: template.config,
      state,
      latestAnswer: null,
      lastQuestion: null,
    });
    state = next.updatedState;

    await this.turnRepo.create({
      sessionId: session.id,
      questionId: next.question.id,
      question: next.question,
      latencyMs: next.telemetry.latencyMs,
      tokenUsage: {
        input: next.telemetry.tokenUsage.input,
        output: next.telemetry.tokenUsage.output,
      },
    });
    await this.sessionRepo.updateState(session.id, state);

    return {
      sessionId: session.id,
      status: "in_progress",
      question: next.question,
      progress: {
        stage: state.stage,
        turnCount: state.turn_count,
        percent: this.stateManager.progressPercent(state, template.config),
      },
    };
  }

  async answer(input: {
    sessionId: string;
    questionId: string;
    answer: Record<string, unknown>;
  }): Promise<
    | {
        sessionId: string;
        status: "in_progress";
        question: QuestionBlock;
        progress: { stage: string; turnCount: number; percent: number };
      }
    | { sessionId: string; status: "completed"; finalReportId: string }
  > {
    const session = await this.sessionRepo.getById(input.sessionId);
    const template = await this.templateRepo.getById(session.template_id);
    const lastTurn = await this.turnRepo.getLastBySession(input.sessionId);
    if (!lastTurn) throw new Error("Cannot submit answer without an existing question");
    if (lastTurn.question_id !== input.questionId) {
      throw new Error(`questionId mismatch. expected ${lastTurn.question_id}, received ${input.questionId}`);
    }

    let state = this.stateManager.fromSessionRow(
      session.compact_summary_json,
      session.slot_state_json,
      session.asked_question_ids_json,
      session.turn_count,
      session.current_stage,
      template.config,
    );
    SessionStateSchema.parse(state);
    state = this.stateManager.applyAnswer(state, lastTurn.question_json, input.answer);
    await this.turnRepo.patchAnswerByQuestion(input.sessionId, input.questionId, input.answer);

    const next = await this.nextQuestionGenerator.generate({
      template: template.config,
      state,
      latestAnswer: input.answer,
      lastQuestion: lastTurn.question_json,
    });
    state = next.updatedState;

    if (next.completion.should_end) {
      const report = await this.reportGenerator.generate({
        candidateId: session.candidate_id,
        sessionId: input.sessionId,
        template: template.config,
        state,
      });
      const finalReportId = await this.reportRepo.create(input.sessionId, report);
      await this.sessionRepo.updateState(input.sessionId, state, "completed");
      return {
        sessionId: input.sessionId,
        status: "completed",
        finalReportId,
      };
    }

    await this.turnRepo.create({
      sessionId: input.sessionId,
      questionId: next.question.id,
      question: next.question,
      latencyMs: next.telemetry.latencyMs,
      tokenUsage: {
        input: next.telemetry.tokenUsage.input,
        output: next.telemetry.tokenUsage.output,
      },
    });
    await this.sessionRepo.updateState(input.sessionId, state, "in_progress");
    return {
      sessionId: input.sessionId,
      status: "in_progress",
      question: next.question,
      progress: {
        stage: state.stage,
        turnCount: state.turn_count,
        percent: this.stateManager.progressPercent(state, template.config),
      },
    };
  }

  async resume(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    lastQuestion: QuestionBlock | null;
    progress: { stage: string; turnCount: number; percent: number };
  }> {
    const session = await this.sessionRepo.getById(sessionId);
    const template = await this.templateRepo.getById(session.template_id);
    const lastTurn = await this.turnRepo.getLastBySession(sessionId);
    const state = this.stateManager.fromSessionRow(
      session.compact_summary_json,
      session.slot_state_json,
      session.asked_question_ids_json,
      session.turn_count,
      session.current_stage,
      template.config,
    );
    return {
      sessionId,
      status: session.status,
      lastQuestion: lastTurn?.question_json ?? null,
      progress: {
        stage: session.current_stage,
        turnCount: session.turn_count,
        percent: this.stateManager.progressPercent(state, template.config),
      },
    };
  }

  async getFinalReport(sessionId: string): Promise<FinalReport | null> {
    const report = await this.reportRepo.getBySessionId(sessionId);
    return report?.report_json ?? null;
  }
}
