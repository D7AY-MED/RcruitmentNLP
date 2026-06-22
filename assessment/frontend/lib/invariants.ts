type RequestMode = "start" | "continue";

type CreateParams = {
  mode: RequestMode;
  store: boolean;
  previousResponseId?: string;
  endpoint: string;
};

export function assertResponsesApiInvariant(params: CreateParams): void {
  if (params.endpoint !== "responses") {
    throw new Error("Invalid API endpoint. Only Responses API is allowed.");
  }

  if (params.store !== true) {
    throw new Error("Invalid request. `store: true` is required.");
  }

  if (params.mode === "continue" && !params.previousResponseId) {
    throw new Error(
      "Invalid request. `previous_response_id` is required for follow-up turns."
    );
  }
}

export function assertNonEmpty(input: string, fieldName: string): void {
  if (!input || !input.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
}
