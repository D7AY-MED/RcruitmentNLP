import { z } from "zod";
import { QUESTION_TYPES } from "../types/interview.js";

const OptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const FieldTypeSchema = z.enum([
  "single_choice",
  "multi_choice",
  "dropdown",
  "short_text",
  "long_text",
  "numeric",
  "date",
  "boolean",
]);

const QuestionFieldSchema = z.object({
  key: z.string().min(1),
  type: FieldTypeSchema,
  label: z.string().min(1),
  required: z.boolean().default(true),
  options: z.array(OptionSchema).optional(),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  max_length: z.number().int().positive().optional(),
  allow_other: z.boolean().optional(),
  other_label: z.string().optional(),
  validation_regex: z.string().optional(),
  store_as: z.string().optional(),
});

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(QUESTION_TYPES),
    title: z.string().min(1),
    description: z.string().optional(),
    required: z.boolean().default(true),
    options: z.array(OptionSchema).optional(),
    fields: z.array(QuestionFieldSchema).max(4).optional(),
    placeholder: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    max_length: z.number().int().positive().optional(),
  })
  .superRefine((question, ctx) => {
    if (
      (question.type === "single_choice" ||
        question.type === "multi_choice" ||
        question.type === "dropdown") &&
      (!question.options || question.options.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "options are required for choice question types",
      });
    }
    if (question.type === "multi_part" && (!question.fields || question.fields.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields"],
        message: "fields are required for multi_part questions",
      });
    }
  });

export const NextQuestionOutputSchema = z.object({
  stage: z.string().min(1),
  objective: z.string().min(1),
  state_updates: z
    .object({
      slots_completed: z.array(z.string()).optional(),
      slots_pending: z.array(z.string()).optional(),
      confidence_updates: z.record(z.number().min(0).max(1)).optional(),
      signals: z.record(z.unknown()).optional(),
    })
    .default({}),
  question: QuestionSchema,
  completion: z.object({
    should_end: z.boolean(),
    reason: z.string().nullable(),
  }),
});

export const StartInterviewRequestSchema = z.object({
  candidateId: z.string().min(1),
  templateId: z.string().min(1).optional(),
});

export const SubmitAnswerRequestSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.record(z.unknown()),
});

export const SessionStateSchema = z.object({
  stage: z.string().min(1),
  slots: z.record(
    z.object({
      status: z.enum(["missing", "partial", "filled", "verified"]),
      value: z.unknown().nullable(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  summary: z.record(z.unknown()),
  asked_questions: z.array(z.string()),
  turn_count: z.number().int().nonnegative(),
  completion_rules: z.object({
    mandatorySlotsRemaining: z.number().int().nonnegative(),
    maxTurns: z.number().int().positive(),
  }),
  confidence_by_competency: z.record(z.number().min(0).max(1)),
});

export const FinalReportSchema = z.object({
  candidateId: z.string(),
  sessionId: z.string(),
  role: z.string(),
  summary: z.string(),
  competencies: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(5),
      confidence: z.number().min(0).max(1),
      evidence: z.array(z.string()),
    }),
  ),
  motivation: z.object({
    strength: z.enum(["low", "medium", "high"]),
    notes: z.string(),
  }),
  communicationNotes: z.object({
    clarity: z.enum(["low", "medium", "high"]),
    confidence: z.enum(["low", "medium", "high"]),
    professionalism: z.enum(["low", "medium", "high"]),
    notes: z.string(),
  }),
  redFlags: z.array(z.string()),
  recommendation: z.enum(["reject", "maybe", "shortlist", "strong_shortlist"]),
});
