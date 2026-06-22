import { QuestionSchema } from "../schemas/interview.js";
import { NextQuestionResult, QuestionBlock, SessionState, TemplateConfig } from "../types/interview.js";
import { OpenAIClient } from "./openaiClient.js";
import { StateManager } from "./stateManager.js";

interface GenerateInput {
  template: TemplateConfig;
  state: SessionState;
  latestAnswer: Record<string, unknown> | null;
  lastQuestion: QuestionBlock | null;
}

export class NextQuestionGenerator {
  constructor(
    private readonly openaiClient: OpenAIClient,
    private readonly stateManager: StateManager,
  ) {}

  async generate(input: GenerateInput): Promise<NextQuestionResult> {
    let aiOutput;
    let telemetry;
    try {
      const result = await this.openaiClient.generateNextQuestion(input);
      aiOutput = result.output;
      telemetry = result.telemetry;
    } catch {
      aiOutput = {
        stage: input.state.stage,
        objective: "Collect missing interview evidence",
        state_updates: {},
        question: this.buildFallbackQuestion(input),
        completion: { should_end: false, reason: null },
      };
      telemetry = {
        model: "fallback",
        latencyMs: 0,
        tokenUsage: { input: 0, output: 0 },
      };
    }

    const question = this.ensureValidQuestion(aiOutput.question, input);
    let updatedState = this.stateManager.applyModelUpdates(input.state, aiOutput.state_updates, input.template);
    updatedState = this.stateManager.markQuestionAsked(updatedState, question.id, aiOutput.stage);
    const completion = this.stateManager.shouldComplete(updatedState, aiOutput.completion);

    return {
      question,
      updatedState,
      completion,
      telemetry,
    };
  }

  private ensureValidQuestion(question: unknown, input: GenerateInput): QuestionBlock {
    const parsed = QuestionSchema.safeParse(question);
    if (!parsed.success) return this.buildFallbackQuestion(input);

    if (input.state.asked_questions.includes(parsed.data.id)) {
      return this.buildFallbackQuestion(input);
    }
    return parsed.data;
  }

  private buildFallbackQuestion(input: GenerateInput): QuestionBlock {
    const stage = input.state.stage;
    const turn = input.state.turn_count;

    if (turn === 0) {
      return {
        id: "q_phase1_profile_basics",
        type: "multi_part",
        title: "Tell us about your current situation",
        description: "Quick profile details to personalize your assessment.",
        required: true,
        fields: [
          {
            key: "education_level",
            type: "dropdown",
            label: "Current education level",
            required: true,
            options: [
              { label: "High School", value: "high_school" },
              { label: "Bachelor", value: "bachelor" },
              { label: "Master", value: "master" },
              { label: "Self-taught", value: "self_taught" },
              { label: "Other", value: "other" },
            ],
          },
          {
            key: "current_status",
            type: "single_choice",
            label: "Current status",
            required: true,
            options: [
              { label: "Student", value: "student" },
              { label: "Employed", value: "employed" },
              { label: "Freelancer", value: "freelancer" },
              { label: "Looking for work", value: "looking" },
            ],
          },
          {
            key: "availability_weeks",
            type: "numeric",
            label: "Available in how many weeks?",
            required: true,
            min: 0,
            max: 52,
          },
        ],
      };
    }

    if (turn === 1) {
      return {
        id: "q_phase1_skill_snapshot",
        type: "multi_part",
        title: "Skills snapshot",
        description: "Short and structured so we can adapt the deep dive.",
        required: true,
        fields: [
          {
            key: "years_experience",
            type: "numeric",
            label: "Years of practical experience",
            required: true,
            min: 0,
            max: 30,
          },
          {
            key: "core_skills",
            type: "multi_choice",
            label: "Core skills you use most",
            required: true,
            options: [
              { label: "JavaScript/TypeScript", value: "js_ts" },
              { label: "Node.js", value: "node" },
              { label: "React", value: "react" },
              { label: "SQL", value: "sql" },
              { label: "Python", value: "python" },
              { label: "DevOps/Cloud", value: "devops_cloud" },
            ],
          },
          {
            key: "technical_evidence",
            type: "short_text",
            label: "One project example",
            required: true,
            placeholder: "e.g. Built API caching layer, reduced latency by 40%",
            max_length: 220,
          },
        ],
      };
    }

    const slotMap: Record<string, QuestionBlock> = {
      education_level: {
        id: `q_${stage}_education_level_${turn + 1}`,
        type: "dropdown",
        title: "Education level",
        description: "Select your current education level.",
        required: true,
        options: [
          { label: "High School", value: "high_school" },
          { label: "Bachelor", value: "bachelor" },
          { label: "Master", value: "master" },
          { label: "Self-taught", value: "self_taught" },
          { label: "Other", value: "other" },
        ],
      },
      current_status: {
        id: `q_${stage}_current_status_${turn + 1}`,
        type: "single_choice",
        title: "Current status",
        description: "Pick the option that matches your situation.",
        required: true,
        options: [
          { label: "Student", value: "student" },
          { label: "Employed", value: "employed" },
          { label: "Freelancer", value: "freelancer" },
          { label: "Looking for work", value: "looking" },
        ],
      },
      years_experience: {
        id: `q_${stage}_years_experience_${turn + 1}`,
        type: "numeric",
        title: "Years of practical experience",
        description: "Approximate full-time equivalent years.",
        required: true,
        min: 0,
        max: 30,
      },
      availability_weeks: {
        id: `q_${stage}_availability_weeks_${turn + 1}`,
        type: "numeric",
        title: "Availability",
        description: "How many weeks before you can start?",
        required: true,
        min: 0,
        max: 52,
      },
      core_skills: {
        id: `q_${stage}_core_skills_${turn + 1}`,
        type: "multi_choice",
        title: "Core skills",
        description: "Select your strongest working skills.",
        required: true,
        options: [
          { label: "JavaScript/TypeScript", value: "js_ts" },
          { label: "Node.js", value: "node" },
          { label: "React", value: "react" },
          { label: "SQL", value: "sql" },
          { label: "Python", value: "python" },
          { label: "DevOps/Cloud", value: "devops_cloud" },
        ],
      },
      motivation_primary_reason: {
        id: `q_${stage}_motivation_${turn + 1}`,
        type: "short_text",
        title: "Main motivation",
        description: "Why are you applying to this role now?",
        required: true,
        placeholder: "Keep it concise",
        max_length: 240,
      },
    };

    const missingSlot = Object.keys(input.state.slots).find((slot) => {
      const s = input.state.slots[slot];
      return s.status === "missing" || s.status === "partial";
    });

    if (missingSlot && slotMap[missingSlot]) {
      return slotMap[missingSlot];
    }

    return {
      id: `q_${stage}_adaptive_${input.state.turn_count + 1}`,
      type: "long_text",
      title: "Technical deep-dive",
      description:
        "Share one concrete challenge you solved, your approach, and the measured impact.",
      required: true,
      max_length: 900,
    };
  }
}
