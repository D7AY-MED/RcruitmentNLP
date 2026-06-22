import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.interview.auth import CandidateAuth, get_current_candidate
from app.interview.cv_parser import extract_cv_text
from app.interview.openai_client import (
    continue_interview_stream,
    start_interview_stream,
)
from app.config import TOTAL_QUESTIONS
from app.interview.prompt import build_interview_prompt
from app.interview import session_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])


async def _sse_stream(
    event_generator: AsyncGenerator[tuple[str, str | dict], None],
) -> AsyncGenerator[bytes, None]:
    async for event_type, payload in event_generator:
        data = json.dumps(payload) if not isinstance(payload, str) else payload
        yield f"event: {event_type}\ndata: {data}\n\n".encode("utf-8")


# ──────────────────────────────────────────────
#  GET /api/v1/interview/session?pool_id=xxx
# ──────────────────────────────────────────────


@router.get("/session")
async def get_session_status(
    pool_id: str,
    candidate: CandidateAuth = Depends(get_current_candidate),
):
    existing = session_store.find_session_by_pool(candidate.candidate_id, pool_id)

    if existing is None:
        return {"status": "none"}

    if existing["session_status"] == "completed":
        return {"status": "completed"}

    current = session_store.get_current_unanswered_question(
        candidate.candidate_id, existing["session_id"]
    )

    if current is None:
        return {"status": "completed"}

    return {
        "status": "active",
        "sessionId": existing["session_id"],
        "responseId": current["openai_session_id"],
        "question": current["question"],
        "sequence": current["sequence"],
    }


# ──────────────────────────────────────────────
#  POST /api/v1/interview/start
# ──────────────────────────────────────────────


@router.post("/start")
async def handle_start(
    cvFile: UploadFile | None = None,
    cvText: str | None = Form(default=None),
    phone: str | None = Form(default=None),
    poolId: str | None = Form(default=None),
    candidate: CandidateAuth = Depends(get_current_candidate),
):
    cv_file_bytes: bytes | None = None
    filename: str | None = None

    if cvFile and cvFile.filename:
        cv_file_bytes = await cvFile.read()
        filename = cvFile.filename

    try:
        cv_content = await extract_cv_text(cvText, cv_file_bytes, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    job_content = ""
    system_prompt = build_interview_prompt(cv_content, job_content)

    session_id = uuid.uuid4()

    async def _start_events():
        yield ("meta", {"sessionId": str(session_id), "status": "active"})

        try:
            response_id = ""
            final_question = ""

            async for event_type, payload in start_interview_stream(system_prompt):
                if event_type == "delta":
                    yield (event_type, payload)
                elif event_type == "done":
                    pd = payload  # type: dict
                    response_id = pd.get("responseId", "")
                    final_question = pd.get("question", "")

            if response_id and final_question:
                try:
                    session_store.create_question(
                        candidate_id=candidate.candidate_id,
                        name=candidate.name,
                        phone=phone or "",
                        session_id=session_id,
                        sequence=1,
                        question=final_question,
                        openai_session_id=response_id,
                        pool_id=poolId or "",
                    )
                except Exception as e:
                    logger.error("DB save failed for first question: %s", e)
                    yield ("error", {"error": "Failed to save interview progress. Please try again."})
                    return

                yield ("done", {
                    "sessionId": str(session_id),
                    "responseId": response_id,
                    "question": final_question,
                    "status": "active",
                })
            else:
                yield ("error", {"error": "Failed to generate first question."})

        except RuntimeError as e:
            logger.error("OpenAI streaming error: %s", e)
            yield ("error", {"error": "AI service error. Please try again."})
        except Exception as e:
            logger.error("Unexpected error in /start SSE: %s", e)
            yield ("error", {"error": "An unexpected error occurred. Please try again."})

    return StreamingResponse(
        _sse_stream(_start_events()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )


# ──────────────────────────────────────────────
#  POST /api/v1/interview/next
# ──────────────────────────────────────────────


class NextQuestionRequest(BaseModel):
    sessionId: str
    previousResponseId: str
    answer: str


@router.post("/next")
async def handle_next(
    body: NextQuestionRequest,
    candidate: CandidateAuth = Depends(get_current_candidate),
):
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    session_uuid = uuid.UUID(body.sessionId)

    current_seq = session_store.get_latest_sequence(
        candidate.candidate_id, session_uuid
    )
    if current_seq == 0:
        raise HTTPException(status_code=404, detail="Session not found.")
    if current_seq > TOTAL_QUESTIONS:
        raise HTTPException(status_code=400, detail="Interview already completed.")

    async def _next_events():
        try:
            new_response_id = ""
            next_question = ""
            delta_buffer: list[dict] = []

            async for event_type, payload in continue_interview_stream(
                body.previousResponseId, body.answer.strip()
            ):
                if event_type == "delta":
                    delta_buffer.append(payload)
                elif event_type == "done":
                    pd = payload  # type: dict
                    new_response_id = pd.get("responseId", "")
                    next_question = pd.get("question", "")

            if not new_response_id or not next_question:
                yield ("error", {"error": "Failed to generate next question."})
                return

            try:
                session_store.update_answer(
                    candidate_id=candidate.candidate_id,
                    session_id=session_uuid,
                    sequence=current_seq,
                    answer=body.answer.strip(),
                )
            except Exception as e:
                logger.error("DB update failed for answer seq=%d: %s", current_seq, e)
                yield ("error", {"error": "Failed to save your answer. Please try again."})
                return

            is_complete = next_question.strip() == "[INTERVIEW_COMPLETE]"
            next_seq = current_seq + 1

            # Guard: never exceed TOTAL_QUESTIONS, even if the model doesn't output [INTERVIEW_COMPLETE]
            if is_complete or current_seq >= TOTAL_QUESTIONS:
                try:
                    session_store.mark_session_completed(
                        candidate_id=candidate.candidate_id,
                        session_id=session_uuid,
                    )
                except Exception as e:
                    logger.error("DB mark_completed failed: %s", e)

                yield ("done", {
                    "completed": True,
                    "responseId": new_response_id,
                    "sessionId": str(session_uuid),
                    "status": "completed",
                })
            else:
                try:
                    session_store.create_question(
                        candidate_id=candidate.candidate_id,
                        name=candidate.name,
                        phone="",
                        session_id=session_uuid,
                        sequence=next_seq,
                        question=next_question,
                        openai_session_id=new_response_id,
                    )
                except Exception as e:
                    logger.error("DB save failed for next question seq=%d: %s", next_seq, e)
                    yield ("error", {"error": "Failed to save interview progress. Please try again."})
                    return

                for delta_payload in delta_buffer:
                    yield ("delta", delta_payload)
                yield ("done", {
                    "completed": False,
                    "responseId": new_response_id,
                    "sessionId": str(session_uuid),
                    "question": next_question,
                    "status": "active",
                })

        except RuntimeError as e:
            logger.error("OpenAI continue error: %s", e)
            yield ("error", {"error": "AI service error. Please try again."})
        except Exception as e:
            logger.error("Unexpected error in /next SSE: %s", e)
            yield ("error", {"error": "An unexpected error occurred. Please try again."})

    return StreamingResponse(
        _sse_stream(_next_events()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )
