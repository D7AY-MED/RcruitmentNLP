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
        "totalQuestions": TOTAL_QUESTIONS,
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

        # Save CV to Supabase storage bucket `candidate_cv`
        try:
            from app.auth import get_supabase
            from app.config import SUPABASE_URL
            supabase = get_supabase()
            ext = filename.rsplit(".", 1)[-1] if filename and "." in filename else "pdf"
            # Clean candidate name to be safe for filename path
            safe_name = "".join(c for c in candidate.name if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
            object_path = f"candidates/{candidate.candidate_id}/{safe_name}_cv.{ext}"
            
            supabase.storage.from_("candidate_cv").upload(
                path=object_path,
                file=cv_file_bytes,
                file_options={"content-type": cvFile.content_type or "application/pdf", "upsert": "true"},
            )
            
            cv_url = f"{SUPABASE_URL}/storage/v1/object/public/candidate_cv/{object_path}"
            
            # Save the cv_url in candidate_profiles table
            try:
                supabase.table("candidate_profiles").upsert(
                    {"id": candidate.candidate_id, "cv_url": cv_url},
                    on_conflict="id"
                ).execute()
                logger.info("Successfully updated candidate profile cv_url: %s", cv_url)
            except Exception as db_err:
                logger.error("Failed to update candidate profile cv_url: %s", db_err)
        except Exception as upload_err:
            logger.error("Failed to upload CV to Supabase storage: %s", upload_err)

    try:
        cv_content = await extract_cv_text(cvText, cv_file_bytes, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    job_content = ""
    if poolId:
        try:
            pool_data = session_store.get_pool_details(poolId)
            if pool_data:
                details_parts = []
                details_parts.append(f"Title: {pool_data.get('title')}")
                if pool_data.get("description"):
                    details_parts.append(f"Description: {pool_data.get('description')}")
                if pool_data.get("main_mission"):
                    details_parts.append(f"Main Mission: {pool_data.get('main_mission')}")
                if pool_data.get("seniority_level"):
                    details_parts.append(f"Seniority Level: {pool_data.get('seniority_level')}")
                if pool_data.get("years_experience") is not None:
                    details_parts.append(f"Required Years of Experience: {pool_data.get('years_experience')}")
                if pool_data.get("experience_range"):
                    details_parts.append(f"Experience Range: {pool_data.get('experience_range')}")
                if pool_data.get("education_level"):
                    details_parts.append(f"Education Level: {pool_data.get('education_level')}")
                if pool_data.get("location"):
                    details_parts.append(f"Location: {pool_data.get('location')}")
                if pool_data.get("contract_type"):
                    details_parts.append(f"Contract Type: {pool_data.get('contract_type')}")
                
                langs = pool_data.get("languages")
                if langs:
                    if isinstance(langs, list):
                        details_parts.append(f"Required Spoken Languages: {', '.join(langs)}")
                    else:
                        details_parts.append(f"Required Spoken Languages: {langs}")

                if pool_data.get("must_have_skills"):
                    details_parts.append(f"Must-Have Skills: {', '.join(pool_data.get('must_have_skills'))}")
                if pool_data.get("nice_to_have_skills"):
                    details_parts.append(f"Nice-to-Have Skills: {', '.join(pool_data.get('nice_to_have_skills'))}")
                if pool_data.get("soft_skills"):
                    details_parts.append(f"Soft Skills: {', '.join(pool_data.get('soft_skills'))}")
                if pool_data.get("deal_breakers"):
                    details_parts.append(f"Deal-Breakers: {', '.join(pool_data.get('deal_breakers'))}")
                if pool_data.get("responsibilities"):
                    details_parts.append(f"Responsibilities: {', '.join(pool_data.get('responsibilities'))}")
                if pool_data.get("notes"):
                    details_parts.append(f"Recruiter Notes (Use these to tailor/ask specific questions): {pool_data.get('notes')}")

                job_content = "\n".join(details_parts)
        except Exception as e:
            logger.error("Failed to fetch pool details for start: %s", e)

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
                    "totalQuestions": TOTAL_QUESTIONS,
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

                # Generate and save candidate summary
                try:
                    questions = session_store.get_session_questions(
                        candidate.candidate_id, session_uuid
                    )
                    candidate_name = candidate.name
                    phone = ""
                    if questions:
                        phone = questions[0].get("phone", "")
                        candidate_name = questions[0].get("name", candidate.name)

                    # Fetch pool details and gemini_store_name first
                    pool_id = ""
                    gemini_store_name = None
                    job_details = "Not specified."
                    if questions:
                        for q in questions:
                            if q.get("pool_id"):
                                pool_id = q.get("pool_id")
                                break
                    if pool_id:
                        gemini_store_name = session_store.get_pool_store_name(pool_id)
                        pool_data = session_store.get_pool_details(pool_id)
                        if pool_data:
                            details_parts = []
                            details_parts.append(f"Title: {pool_data.get('title')}")
                            if pool_data.get("description"):
                                details_parts.append(f"Description: {pool_data.get('description')}")
                            if pool_data.get("main_mission"):
                                details_parts.append(f"Main Mission: {pool_data.get('main_mission')}")
                            if pool_data.get("seniority_level"):
                                details_parts.append(f"Seniority Level: {pool_data.get('seniority_level')}")
                            if pool_data.get("years_experience") is not None:
                                details_parts.append(f"Required Years of Experience: {pool_data.get('years_experience')}")
                            if pool_data.get("experience_range"):
                                details_parts.append(f"Experience Range: {pool_data.get('experience_range')}")
                            if pool_data.get("education_level"):
                                details_parts.append(f"Education Level: {pool_data.get('education_level')}")
                            if pool_data.get("location"):
                                details_parts.append(f"Location: {pool_data.get('location')}")
                            if pool_data.get("contract_type"):
                                details_parts.append(f"Contract Type: {pool_data.get('contract_type')}")
                            
                            langs = pool_data.get("languages")
                            if langs:
                                if isinstance(langs, list):
                                    details_parts.append(f"Required Spoken Languages: {', '.join(langs)}")
                                else:
                                    details_parts.append(f"Required Spoken Languages: {langs}")

                            if pool_data.get("must_have_skills"):
                                details_parts.append(f"Must-Have Skills: {', '.join(pool_data.get('must_have_skills'))}")
                            if pool_data.get("nice_to_have_skills"):
                                details_parts.append(f"Nice-to-Have Skills: {', '.join(pool_data.get('nice_to_have_skills'))}")
                            if pool_data.get("soft_skills"):
                                details_parts.append(f"Soft Skills: {', '.join(pool_data.get('soft_skills'))}")
                            if pool_data.get("deal_breakers"):
                                details_parts.append(f"Deal-Breakers: {', '.join(pool_data.get('deal_breakers'))}")
                            if pool_data.get("responsibilities"):
                                details_parts.append(f"Responsibilities: {', '.join(pool_data.get('responsibilities'))}")
                            if pool_data.get("notes"):
                                details_parts.append(f"Recruiter Notes: {pool_data.get('notes')}")
                            job_details = "\n".join(details_parts)

                    # Generate summary and score using OpenAI
                    from app.interview.openai_client import generate_summary_and_score
                    summary_text, score_text = await generate_summary_and_score(new_response_id, job_details)

                    # Save summary and score to Supabase Candidate_summaries table (including gemini_store_name and score)
                    session_store.save_candidate_summary(
                        candidate_id=candidate.candidate_id,
                        candidate_name=candidate_name,
                        summary=summary_text,
                        phone=phone,
                        score=score_text,
                        gemini_store_name=gemini_store_name,
                    )
                    logger.info("Successfully generated and saved database summary and score for candidate %s", candidate.candidate_id)

                    # Upload summary to Gemini File Search Store if store name exists
                    if gemini_store_name:
                        try:
                            from app.services.gemini_store_service import GeminiStoreService
                            gemini_service = GeminiStoreService()
                            gemini_service.upload_candidate_summary(
                                store_name=gemini_store_name,
                                candidate_name=candidate_name,
                                candidate_id=str(candidate.candidate_id),
                                summary_text=summary_text
                            )
                            logger.info("Successfully uploaded summary to Gemini store %s", gemini_store_name)
                        except Exception as gem_err:
                            logger.error("Failed to upload summary to Gemini File Search Store: %s", gem_err)
                    else:
                        logger.warning("No gemini_store_name found or pool_id missing for session %s", session_uuid)

                except Exception as sum_err:
                    logger.error("Failed to generate or save candidate summary: %s", sum_err)

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
                    "totalQuestions": TOTAL_QUESTIONS,
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
