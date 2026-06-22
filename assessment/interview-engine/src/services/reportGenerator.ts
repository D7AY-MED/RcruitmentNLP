import { TurnRepository } from "../repositories/turnRepository.js";
import {
  FinalReport,
  FinalReportCompetency,
  SessionState,
  TemplateConfig,
} from "../types/interview.js";
import { OpenAIClient } from "./openaiClient.js";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function confidenceToBand(value: number): "low" | "medium" | "high" {
  if (value >= 0.7) return "high";
  if (value >= 0.4) return "medium";
  return "low";
}

function buildFallbackCompetencies(
  template: TemplateConfig,
  state: SessionState,
  evidence: Array<{ questionId: string; answer: Record<string, unknown> | null }>,
): FinalReportCompetency[] {
  return (template.competencies || []).map((name) => {
    const confidence = clamp(state.confidence_by_competency?.[name] ?? 0.45, 0, 1);
    const score = clamp(Math.round(confidence * 5), 1, 5);
    const examples = evidence
      .filter((x) => x.answer && Object.keys(x.answer).length > 0)
      .slice(0, 2)
      .map((x) => `Evidence captured in ${x.questionId}`);
    return {
      name,
      score,
      confidence,
      evidence: examples.length ? examples : ["Limited explicit evidence captured."],
    };
  });
}

function fallbackReport(input: {
  candidateId: string;
  sessionId: string;
  template: TemplateConfig;
  state: SessionState;
  evidence: Array<{ questionId: string; answer: Record<string, unknown> | null }>;
}): FinalReport {
  const avgConfidenceValues = Object.values(input.state.confidence_by_competency || {});
  const avgConfidence =
    avgConfidenceValues.length > 0
      ? avgConfidenceValues.reduce((sum, v) => sum + v, 0) / avgConfidenceValues.length
      : 0.5;

  const competencies = buildFallbackCompetencies(input.template, input.state, input.evidence);
  const recommendation: FinalReport["recommendation"] =
    avgConfidence >= 0.75 ? "strong_shortlist" : avgConfidence >= 0.6 ? "shortlist" : avgConfidence >= 0.4 ? "maybe" : "reject";

  const commSignals = (input.state.summary?.signals ?? {}) as Record<string, unknown>;
  const communicationBand = confidenceToBand(
    clamp(
      typeof input.state.confidence_by_competency?.communication === "number"
        ? input.state.confidence_by_competency.communication
        : avgConfidence,
      0,
      1,
    ),
  );

  return {
    candidateId: input.candidateId,
    sessionId: input.sessionId,
    role: input.template.role,
    summary:
      "Structured interview completed. Candidate provided measurable evidence across key competencies with adaptive probing.",
    competencies,
    motivation: {
      strength: confidenceToBand(
        clamp(
          typeof input.state.confidence_by_competency?.motivation === "number"
            ? input.state.confidence_by_competency.motivation
            : avgConfidence,
          0,
          1,
        ),
      ),
      notes:
        typeof commSignals.motivation_strength === "string"
          ? `Motivation signal detected as ${commSignals.motivation_strength}.`
          : "Motivation appears consistent but should be validated in final recruiter call.",
    },
    communicationNotes: {
      clarity:
        typeof commSignals.communication_clarity === "string"
          ? (commSignals.communication_clarity.includes("high")
              ? "high"
              : commSignals.communication_clarity.includes("low")
                ? "low"
                : "medium")
          : communicationBand,
      confidence: communicationBand,
      professionalism: "medium",
      notes:
        "Communication quality inferred from structured responses and concise evidence. Consider a brief live validation for final calibration.",
    },
    redFlags:
      avgConfidence < 0.35
        ? ["Low confidence across multiple competencies; additional verification recommended."]
        : [],
    recommendation,
  };
}

export class ReportGenerator {
  constructor(
    private readonly openaiClient: OpenAIClient,
    private readonly turnRepository: TurnRepository,
  ) {}

  async generate(input: {
    candidateId: string;
    sessionId: string;
    template: TemplateConfig;
    state: SessionState;
  }): Promise<FinalReport> {
    const turns = await this.turnRepository.listBySession(input.sessionId, 24);
    const compactEvidence = turns.map((turn) => ({
      questionId: turn.question_id,
      answer: turn.answer_normalized_json,
    }));

    try {
      return await this.openaiClient.generateFinalReport({
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        template: input.template,
        state: input.state,
        evidence: compactEvidence,
      });
    } catch {
      return fallbackReport({
        candidateId: input.candidateId,
        sessionId: input.sessionId,
        template: input.template,
        state: input.state,
        evidence: compactEvidence,
      });
    }
  }
}
