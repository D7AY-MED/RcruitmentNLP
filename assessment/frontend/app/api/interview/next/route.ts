import { NextResponse } from "next/server";
import { z } from "zod";
import { assertNonEmpty } from "@/lib/invariants";
import { continueInterviewStream } from "@/lib/responses-client";

export const runtime = "nodejs";

const NextRequestSchema = z.object({
  previousResponseId: z.string().min(1),
  answer: z.string().min(1)
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { previousResponseId, answer } = NextRequestSchema.parse(body);
    assertNonEmpty(answer, "answer");
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const pushEvent = (event: string, payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        };

        try {
          let finalQuestion = "";
          let finalResponseId = "";

          for await (const event of continueInterviewStream(
            previousResponseId,
            answer.trim()
          )) {
            if (event.type === "delta") {
              pushEvent("delta", { delta: event.delta });
            }

            if (event.type === "done") {
              finalQuestion = event.question;
              finalResponseId = event.responseId;
            }
          }

          const isComplete = finalQuestion.trim() === "[INTERVIEW_COMPLETE]";
          if (isComplete) {
            pushEvent("done", {
              completed: true,
              responseId: finalResponseId,
              status: "completed"
            });
          } else {
            pushEvent("done", {
              completed: false,
              responseId: finalResponseId,
              question: finalQuestion,
              status: "active"
            });
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to stream follow-up question.";
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to continue interview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
