import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { extractCvTextFromFormData } from "@/lib/cv";
import { assertNonEmpty } from "@/lib/invariants";
import { buildInterviewPrompt } from "@/lib/prompt";
import { startInterviewStream } from "@/lib/responses-client";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const candidateNameValue = formData.get("candidateName");
    const candidateName =
      typeof candidateNameValue === "string" ? candidateNameValue.trim() : "";

    assertNonEmpty(candidateName, "candidateName");
    const cvText = await extractCvTextFromFormData(formData);
    assertNonEmpty(cvText, "cvText");

    const systemPrompt = await buildInterviewPrompt(cvText);
    const sessionId = randomUUID();

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const pushEvent = (event: string, payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        };

        try {
          pushEvent("meta", { sessionId, status: "active" });

          for await (const event of startInterviewStream(systemPrompt)) {
            if (event.type === "delta") {
              pushEvent("delta", { delta: event.delta });
            }

            if (event.type === "done") {
              pushEvent("done", {
                sessionId,
                responseId: event.responseId,
                question: event.question,
                status: "active"
              });
            }
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to stream interview.";
          pushEvent("error", { error: message });
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start interview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
