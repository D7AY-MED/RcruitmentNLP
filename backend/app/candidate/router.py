import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.auth import get_current_candidate, get_supabase, parse_datetime
from app.schemas_candidate import (
    CandidateLogin,
    CandidateOut,
    CandidateProfileUpdate,
    CandidateRegister,
    CandidateToken,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/candidate", tags=["candidate"])


def _build_candidate_out(
    user_id: str,
    email: str,
    profile: dict | None,
    created_at: str | None = None,
) -> CandidateOut:
    return CandidateOut(
        id=uuid.UUID(user_id),
        full_name=(profile or {}).get("full_name", ""),
        email=email,
        phone=(profile or {}).get("phone"),
        title=(profile or {}).get("title"),
        phone_number=(profile or {}).get("phone_number"),
        linkedin_url=(profile or {}).get("linkedin_url"),
        current_job_title=(profile or {}).get("current_job_title"),
        current_company=(profile or {}).get("current_company"),
        years_of_experience=(profile or {}).get("years_of_experience"),
        city=(profile or {}).get("city"),
        education_level=(profile or {}).get("education_level"),
        university_name=(profile or {}).get("university_name"),
        field_of_study=(profile or {}).get("field_of_study"),
        languages=(profile or {}).get("languages"),
        expected_salary_min=_to_float((profile or {}).get("expected_salary_min")),
        expected_salary_max=_to_float((profile or {}).get("expected_salary_max")),
        profile_picture_url=(profile or {}).get("profile_picture_url"),
        open_to_work=(profile or {}).get("open_to_work", True),
        created_at=parse_datetime(created_at),
    )


def _to_float(v):
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def _fetch_profile(user_id: str) -> dict | None:
    client = get_supabase()
    result = client.table("candidate_profiles").select("*").eq("id", user_id).limit(1).execute()
    return result.data[0] if result.data else None


@router.get("/health")
async def health():
    return {"status": "ok", "service": "candidate"}


@router.get("/offer/demo")
async def get_demo_offer():
    return {
        "title": "Sr Consultant Transaction Services",
        "company_name": "PooLink Confidential",
        "location": "Casablanca",
        "contract_type": "CDI",
        "salary_range": "18 000 – 25 000 DHs",
        "experience_level": "3 – 5 ans",
        "company_description": (
            "Cabinet international de conseil et d'audit de premier plan, "
            "offrant des services de Transaction Services, Due Diligence et "
            "Advisory à une clientèle variée au Maroc et en Afrique."
        ),
        "sections": {
            "about": (
                "Dans un cabinet international, vous contribuerez à des "
                "missions de due diligence dans le cadre d'opérations de "
                "financement."
            ),
            "missions": [
                "Réaliser des missions de due diligence financière (buy-side / sell-side).",
                "Analyser la performance historique et future des cibles.",
                "Challenger les éléments de valorisation et identifier les risques.",
                "Préparer des rapports de due diligence structurés.",
            ],
            "profile": [
                "BAC +5 (grande école de commerce ou université de premier plan).",
                "3 à 5 ans d'expérience en Transaction Services.",
                "Maîtrise d'Excel, PowerPoint, outils de visualisation.",
                "Français et anglais courants.",
            ],
            "benefits": [
                "Environnement international stimulant.",
                "Programme de formation continue.",
                "Rémunération compétitive.",
                "Opportunités d'évolution rapide.",
            ],
        },
    }


@router.post("/register", response_model=CandidateToken, status_code=status.HTTP_201_CREATED)
def register(payload: CandidateRegister):
    client = get_supabase()

    try:
        created = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "phone": payload.phone or "",
            },
        })
    except Exception as e:
        msg = str(e)
        is_duplicate = "already" in msg or "exist" in msg
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if is_duplicate else status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists." if is_duplicate else msg,
        )

    user_id = created.user.id

    try:
        profile_data = {
            "id": user_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "phone": payload.phone or None,
        }
        client.table("candidate_profiles").upsert(profile_data).execute()
    except Exception as e:
        try:
            client.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {e}",
        )

    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account created, but sign-in failed. Please login. Details: {e}",
        )

    profile = _fetch_profile(user_id)
    return CandidateToken(
        access_token=session.session.access_token,
        candidate=_build_candidate_out(
            user_id=user_id,
            email=payload.email,
            profile=profile,
            created_at=getattr(created.user, "created_at", None),
        ),
    )


@router.post("/login", response_model=CandidateToken)
def login(payload: CandidateLogin):
    client = get_supabase()

    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = session.user.id
    profile = _fetch_profile(user_id)

    if not profile:
        meta = session.user.user_metadata or {}
        profile_data = {
            "id": user_id,
            "full_name": meta.get("full_name", ""),
            "email": session.user.email,
            "phone": meta.get("phone", None),
        }
        client.table("candidate_profiles").upsert(profile_data).execute()
        profile = profile_data

    return CandidateToken(
        access_token=session.session.access_token,
        candidate=_build_candidate_out(
            user_id=user_id,
            email=session.user.email,
            profile=profile,
            created_at=getattr(session.user, "created_at", None),
        ),
    )


@router.get("/me", response_model=CandidateOut)
def me(current=Depends(get_current_candidate)):
    client = get_supabase()
    sb_user = None
    try:
        sb_user = client.auth.admin.get_user_by_id(current["id"])
    except Exception:
        pass
    profile = _fetch_profile(current["id"])
    return _build_candidate_out(
        user_id=current["id"],
        email=current["email"],
        profile=profile,
        created_at=sb_user.user.created_at if sb_user else None,
    )


def _ensure_profile_base(user_id: str, sb_email: str) -> dict:
    existing = _fetch_profile(user_id)
    if existing:
        return existing
    return {"id": user_id, "full_name": "", "email": sb_email}


@router.put("/profile", response_model=CandidateOut)
def update_profile(payload: CandidateProfileUpdate, current=Depends(get_current_candidate)):
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    base = _ensure_profile_base(current["id"], current["email"])
    base.update(update_data)
    base["id"] = current["id"]
    get_supabase().table("candidate_profiles").upsert(base, on_conflict="id").execute()

    profile = _fetch_profile(current["id"])
    return _build_candidate_out(
        user_id=current["id"],
        email=current["email"],
        profile=profile,
    )


@router.post("/profile/picture", response_model=CandidateOut)
def upload_profile_picture(file: UploadFile, current=Depends(get_current_candidate)):
    from app.config import SUPABASE_URL

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    object_path = f"candidates/{current['id']}/avatar.{ext}"
    file_bytes = file.file.read()

    supabase = get_supabase()
    try:
        supabase.storage.from_("candidate-avatars").upload(
            path=object_path,
            file=file_bytes,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as e:
        logger.warning("Storage upload failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload profile picture",
        )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/candidate-avatars/{object_path}"

    base = _ensure_profile_base(current["id"], current["email"])
    base["profile_picture_url"] = public_url
    base["id"] = current["id"]
    supabase.table("candidate_profiles").upsert(base, on_conflict="id").execute()

    profile = _fetch_profile(current["id"])
    return _build_candidate_out(
        user_id=current["id"],
        email=current["email"],
        profile=profile,
    )
