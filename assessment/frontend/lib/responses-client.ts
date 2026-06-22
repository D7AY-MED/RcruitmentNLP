import OpenAI from "openai";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assertResponsesApiInvariant } from "./invariants";

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

let cachedKey: string | null = null;

function parseKeyFromEnvFile(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    if (!trimmed.startsWith("OPENAI_API_KEY=")) {
      continue;
    }
    const raw = trimmed.slice("OPENAI_API_KEY=".length).trim();
    if (!raw) {
      return null;
    }
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return raw.slice(1, -1);
    }
    return raw;
  }
  return null;
}

function getOpenAiApiKey(): string {
  if (cachedKey) {
    return cachedKey;
  }

  const direct = process.env.OPENAI_API_KEY?.trim();
  if (direct) {
    cachedKey = direct;
    return direct;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env.local"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env")
  ];

  for (const candidate of candidates) {
    const fromFile = parseKeyFromEnvFile(candidate);
    if (fromFile) {
      cachedKey = fromFile;
      return fromFile;
    }
  }

  throw new Error(
    "OPENAI_API_KEY is missing. Add it to assessment/frontend/.env.local or the project root .env."
  );
}

function getOpenAiClient(): OpenAI {
  return new OpenAI({
    apiKey: getOpenAiApiKey()
  });
}

type StartInterviewResult = {
  responseId: string;
  question: string;
};

type ContinueInterviewResult = {
  responseId: string;
  question: string;
};

export type InterviewStreamEvent =
  | {
      type: "delta";
      delta: string;
    }
  | {
      type: "done";
      responseId: string;
      question: string;
    };

function extractQuestion(response: OpenAI.Responses.Response): string {
  const direct = response.output_text?.trim();
  if (direct) {
    return direct;
  }

  for (const item of response.output ?? []) {
    if (item.type !== "message") {
      continue;
    }
    for (const content of item.content) {
      if (content.type === "output_text") {
        const text = content.text?.trim();
        if (text) {
          return text;
        }
      }
    }
  }

  throw new Error("No question returned by model.");
}

export async function startInterview(systemPrompt: string): Promise<StartInterviewResult> {
  assertResponsesApiInvariant({
    mode: "start",
    endpoint: "responses",
    store: true
  });

  const response = await getOpenAiClient().responses.create({
    model,
    store: true,
    input: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content:
          "Start the interview now by asking the first personalized question."
      }
    ]
  });

  return {
    responseId: response.id,
    question: extractQuestion(response)
  };
}

export async function continueInterview(
  previousResponseId: string,
  candidateAnswer: string
): Promise<ContinueInterviewResult> {
  assertResponsesApiInvariant({
    mode: "continue",
    endpoint: "responses",
    store: true,
    previousResponseId
  });

  const response = await getOpenAiClient().responses.create({
    model,
    store: true,
    previous_response_id: previousResponseId,
    input: candidateAnswer
  });

  return {
    responseId: response.id,
    question: extractQuestion(response)
  };
}

export async function getLatestQuestionFromResponse(
  responseId: string
): Promise<string | null> {
  const response = await getOpenAiClient().responses.retrieve(responseId);
  const text = response.output_text?.trim();
  return text || null;
}

async function* streamQuestionFromOpenAi(
  request:
    | {
        type: "start";
        systemPrompt: string;
      }
    | {
        type: "continue";
        previousResponseId: string;
        candidateAnswer: string;
      }
): AsyncGenerator<InterviewStreamEvent> {
  assertResponsesApiInvariant({
    mode: request.type === "start" ? "start" : "continue",
    endpoint: "responses",
    store: true,
    previousResponseId:
      request.type === "continue" ? request.previousResponseId : undefined
  });

  const stream =
    request.type === "start"
      ? await getOpenAiClient().responses.create({
          model,
          store: true,
          stream: true,
          input: [
            {
              role: "system",
              content: request.systemPrompt
            },
            {
              role: "user",
              content:
                "Start the interview now by asking the first personalized question."
            }
          ]
        })
      : await getOpenAiClient().responses.create({
          model,
          store: true,
          stream: true,
          previous_response_id: request.previousResponseId,
          input: request.candidateAnswer
        });

  let responseId = "";
  let question = "";

  for await (const event of stream as AsyncIterable<Record<string, unknown>>) {
    const eventType = typeof event.type === "string" ? event.type : "";

    const maybeResponse = event.response as
      | { id?: string; output_text?: string }
      | undefined;
    if (!responseId && maybeResponse?.id) {
      responseId = maybeResponse.id;
    }

    if (eventType === "response.output_text.delta") {
      const delta = typeof event.delta === "string" ? event.delta : "";
      if (delta) {
        question += delta;
        yield { type: "delta", delta };
      }
      continue;
    }

    if (eventType === "response.output_text.done") {
      const text = typeof event.text === "string" ? event.text : "";
      if (!question && text) {
        question = text;
      }
      continue;
    }

    if (eventType === "response.completed") {
      const finalText = maybeResponse?.output_text?.trim();
      if ((!question || !question.trim()) && finalText) {
        question = finalText;
      }

      const normalizedQuestion = question.trim();
      if (!responseId || !normalizedQuestion) {
        throw new Error("Streaming completed without question payload.");
      }

      yield {
        type: "done",
        responseId,
        question: normalizedQuestion
      };
      return;
    }

    if (eventType === "error") {
      const errorObj = event.error as { message?: string } | undefined;
      throw new Error(errorObj?.message || "OpenAI streaming error.");
    }
  }

  throw new Error("OpenAI stream ended before completion.");
}

export async function* startInterviewStream(
  systemPrompt: string
): AsyncGenerator<InterviewStreamEvent> {
  yield* streamQuestionFromOpenAi({
    type: "start",
    systemPrompt
  });
}

export async function* continueInterviewStream(
  previousResponseId: string,
  candidateAnswer: string
): AsyncGenerator<InterviewStreamEvent> {
  yield* streamQuestionFromOpenAi({
    type: "continue",
    previousResponseId,
    candidateAnswer
  });
}
