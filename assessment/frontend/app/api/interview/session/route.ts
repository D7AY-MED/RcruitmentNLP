import { NextResponse } from "next/server";
import { getLatestQuestionFromResponse } from "@/lib/responses-client";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id")?.trim();
    const responseId = searchParams.get("responseId")?.trim();

    if (!sessionId || !responseId) {
      return NextResponse.json(
        { error: "Session id and responseId are required." },
        { status: 400 }
      );
    }
    const currentQuestion = await getLatestQuestionFromResponse(responseId);

    return NextResponse.json({
      id: sessionId,
      status: "active",
      currentQuestion,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch session state.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
