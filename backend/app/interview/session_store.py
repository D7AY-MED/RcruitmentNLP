import logging
import uuid
from datetime import datetime, timezone

from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

logger = logging.getLogger(__name__)

_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else None


def _get_table():
    if _supabase is None:
        raise RuntimeError("Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    return _supabase.table("interview_sessions")


def create_question(
    candidate_id: str,
    name: str,
    phone: str,
    session_id: uuid.UUID,
    sequence: int,
    question: str,
    openai_session_id: str,
    pool_id: str = "",
) -> dict:
    data = {
        "candidate_id": candidate_id,
        "name": name,
        "phone": phone,
        "session_id": str(session_id),
        "sequence": sequence,
        "question": question,
        "openai_session_id": openai_session_id,
        "session_status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pool_id": pool_id,
    }
    result = _get_table().insert(data).execute()
    return result.data[0] if result.data else {}


def update_answer(
    candidate_id: str,
    session_id: uuid.UUID,
    sequence: int,
    answer: str,
) -> None:
    _get_table() \
        .update({"answer": answer}) \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", str(session_id)) \
        .eq("sequence", sequence) \
        .execute()


def mark_session_completed(
    candidate_id: str,
    session_id: uuid.UUID,
) -> None:
    _get_table() \
        .update({"session_status": "completed"}) \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", str(session_id)) \
        .execute()


def get_latest_openai_session_id(
    candidate_id: str, session_id: uuid.UUID
) -> str | None:
    result = _get_table() \
        .select("openai_session_id") \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", str(session_id)) \
        .order("sequence", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0]["openai_session_id"] if result.data else None


def get_latest_sequence(candidate_id: str, session_id: uuid.UUID) -> int:
    result = _get_table() \
        .select("sequence") \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", str(session_id)) \
        .order("sequence", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0]["sequence"] if result.data else 0


def get_session_questions(
    candidate_id: str, session_id: uuid.UUID
) -> list[dict]:
    result = _get_table() \
        .select("*") \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", str(session_id)) \
        .order("sequence") \
        .execute()
    return result.data if result.data else []


def find_session_by_pool(
    candidate_id: str, pool_id: str
) -> dict | None:
    result = _get_table() \
        .select("session_id, session_status") \
        .eq("candidate_id", candidate_id) \
        .eq("pool_id", pool_id) \
        .order("timestamp", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0] if result.data else None


def get_current_unanswered_question(
    candidate_id: str, session_id: str
) -> dict | None:
    result = _get_table() \
        .select("*") \
        .eq("candidate_id", candidate_id) \
        .eq("session_id", session_id) \
        .is_("answer", "null") \
        .order("sequence", desc=True) \
        .limit(1) \
        .execute()
    return result.data[0] if result.data else None
