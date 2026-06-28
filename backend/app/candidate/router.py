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
    PasswordChange,
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
        cv_url=(profile or {}).get("cv_url"),
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
        refresh_token=getattr(session.session, "refresh_token", None),
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
        refresh_token=getattr(session.session, "refresh_token", None),
        candidate=_build_candidate_out(
            user_id=user_id,
            email=session.user.email,
            profile=profile,
            created_at=getattr(session.user, "created_at", None),
        ),
    )


@router.post("/refresh")
def refresh_token(payload: dict):
    """Exchange a Supabase refresh_token for a new access_token so candidate
    sessions survive past the ~1h access-token expiry (no re-login needed)."""
    import httpx
    from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

    rt = (payload or {}).get("refresh_token")
    if not rt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="refresh_token requis.")
    try:
        r = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
            headers={"apikey": SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json"},
            json={"refresh_token": rt},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée. Reconnectez-vous.")
    return {
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
        "token_type": "bearer",
    }


@router.get("/me", response_model=CandidateOut)
def me(current=Depends(get_current_candidate)):
    client = get_supabase()
    sb_user = None
    try:
        sb_user = client.auth.admin.get_user_by_id(current["id"])
    except Exception:
        pass
    profile = _fetch_profile(current["id"]) or {}
    # Fall back to the cv_url stored in Auth user_metadata when the
    # candidate_profiles column isn't present.
    if not profile.get("cv_url") and sb_user:
        meta = getattr(sb_user.user, "user_metadata", {}) or {}
        if meta.get("cv_url"):
            profile["cv_url"] = meta["cv_url"]
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


@router.post("/password")
def change_password(payload: PasswordChange, current=Depends(get_current_candidate)):
    client = get_supabase()
    # Verify the current password before changing it.
    try:
        client.auth.sign_in_with_password(
            {"email": current["email"], "password": payload.current_password}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect."
        )
    try:
        client.auth.admin.update_user_by_id(current["id"], {"password": payload.new_password})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec de la mise à jour du mot de passe: {e}",
        )
    return {"ok": True, "message": "Mot de passe mis à jour."}


CV_BUCKET = "candidate_cv"
MAX_CV_BYTES = 10 * 1024 * 1024  # 10 MB


def _cv_public_url(object_path: str) -> str:
    from app.config import SUPABASE_URL
    return f"{SUPABASE_URL}/storage/v1/object/public/{CV_BUCKET}/{object_path}"


def find_candidate_cv(supabase, candidate_id: str) -> dict | None:
    """The candidate's CV derived directly from Storage (the source of truth).

    No DB column or metadata needed — a single list() call, always consistent.
    """
    folder = f"candidates/{candidate_id}"
    try:
        items = supabase.storage.from_(CV_BUCKET).list(folder) or []
    except Exception:
        return None

    best = None
    for it in items:
        nm = it.get("name") if isinstance(it, dict) else getattr(it, "name", None)
        if not nm or not nm.lower().startswith("cv."):
            continue
        meta = (it.get("metadata") if isinstance(it, dict) else getattr(it, "metadata", None)) or {}
        updated = (it.get("updated_at") if isinstance(it, dict) else None) or meta.get("lastModified")
        info = {
            "cv_url": _cv_public_url(f"{folder}/{nm}"),
            "name": nm,
            "size": meta.get("size") or meta.get("contentLength"),
            "updated_at": updated,
        }
        if best is None or str(updated or "") > str(best.get("updated_at") or ""):
            best = info
    return best


@router.get("/cv")
def get_cv(current=Depends(get_current_candidate)):
    return find_candidate_cv(get_supabase(), current["id"]) or {"cv_url": None}


@router.post("/cv")
def upload_cv(file: UploadFile, current=Depends(get_current_candidate)):
    name = (file.filename or "").lower()
    if not name.endswith((".pdf", ".doc", ".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être un PDF, DOC ou DOCX.",
        )

    file_bytes = file.file.read()
    if len(file_bytes) > MAX_CV_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier dépasse la taille maximale (10 Mo).",
        )

    ext = name.rsplit(".", 1)[-1]
    object_path = f"candidates/{current['id']}/cv.{ext}"
    supabase = get_supabase()
    opts = {"content-type": file.content_type or "application/octet-stream", "upsert": "true"}

    def _do_upload():
        supabase.storage.from_(CV_BUCKET).upload(path=object_path, file=file_bytes, file_options=opts)

    try:
        _do_upload()
    except Exception as e:
        # Most likely the bucket doesn't exist yet — create it (public) and retry once.
        logger.warning("CV upload failed (%s); creating bucket and retrying", e)
        try:
            supabase.storage.create_bucket(CV_BUCKET, options={"public": True})
        except Exception:
            pass
        try:
            _do_upload()
        except Exception as e2:
            logger.error("CV upload failed: %s", e2)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Échec du téléversement du CV: {e2}",
            )

    return {"cv_url": _cv_public_url(object_path), "name": f"cv.{ext}", "size": len(file_bytes)}


@router.delete("/cv")
def delete_cv(current=Depends(get_current_candidate)):
    supabase = get_supabase()
    folder = f"candidates/{current['id']}"
    try:
        paths = [
            f"{folder}/{it.get('name')}"
            for it in (supabase.storage.from_(CV_BUCKET).list(folder) or [])
            if (it.get("name") or "").lower().startswith("cv.")
        ]
        if paths:
            supabase.storage.from_(CV_BUCKET).remove(paths)
    except Exception as e:
        logger.warning("CV delete failed: %s", e)
    return {"ok": True}


# ───────────────────────── AI offer recommendations ─────────────────────────


def _profile_to_text(profile: dict, email: str) -> str:
    parts = [f"Email: {email}"]

    def add(label, val):
        if val not in (None, "", [], {}):
            parts.append(f"{label}: {val}")

    add("Nom", profile.get("full_name"))
    add("Titre / accroche", profile.get("title"))
    add("Poste actuel", profile.get("current_job_title"))
    add("Entreprise actuelle", profile.get("current_company"))
    add("Années d'expérience", profile.get("years_of_experience"))
    add("Ville", profile.get("city"))
    add("Niveau d'études", profile.get("education_level"))
    add("Université", profile.get("university_name"))
    add("Domaine d'études", profile.get("field_of_study"))
    langs = profile.get("languages")
    if isinstance(langs, list) and langs:
        add("Langues", ", ".join(str(x) for x in langs))
    add("Salaire souhaité (min)", profile.get("expected_salary_min"))
    return "\n".join(parts)


def _extract_cv_text(supabase, candidate_id: str) -> str:
    info = find_candidate_cv(supabase, candidate_id)
    name = (info or {}).get("name")
    if not name or not name.lower().endswith(".pdf"):
        return ""  # only PDF text extraction is supported
    try:
        import io
        from pypdf import PdfReader

        data = supabase.storage.from_(CV_BUCKET).download(f"candidates/{candidate_id}/{name}")
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        return " ".join(text.split())[:6000]
    except Exception as e:
        logger.warning("CV text extraction failed: %s", e)
        return ""


def _fetch_active_pools(supabase) -> list[dict]:
    try:
        res = (
            supabase.table("job_pools")
            .select("*, hr_profiles(*)")
            .eq("status", True)
            .order("created_at", desc=True)
            .limit(40)
            .execute()
        )
    except Exception as e:
        logger.error("Could not fetch active pools for recommendations: %s", e)
        return []
    pools = []
    for row in res.data or []:
        hr = row.get("hr_profiles") or {}
        pools.append({
            "id": str(row.get("id")),
            "title": row.get("title"),
            "company": hr.get("company_name"),
            "location": row.get("location"),
            "contract": row.get("contract_type"),
            "experience": row.get("experience_level"),
            "education": row.get("education_level"),
            "language": row.get("language"),
            "skills": row.get("required_skills") or row.get("must_have_skills") or [],
            "description": (row.get("description") or row.get("main_mission") or "")[:500],
        })
    return pools


async def _ai_rank(profile_text: str, cv_text: str, pools: list[dict]) -> list[dict]:
    import json
    import os
    from openai import AsyncOpenAI

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return []
    model = os.environ.get("OPENAI_INTERVIEW_MODEL", "gpt-4.1-mini")
    compact = [
        {k: p[k] for k in ("id", "title", "company", "location", "contract", "experience", "skills", "description")}
        for p in pools
    ]
    prompt = (
        "Tu es un assistant carrière expert. Recommande au candidat les offres les plus pertinentes "
        "en te basant sur son PROFIL et son CV.\n\n"
        f"PROFIL DU CANDIDAT:\n{profile_text}\n\n"
        f"CV DU CANDIDAT (texte extrait):\n{cv_text or '(aucun CV fourni)'}\n\n"
        f"OFFRES DISPONIBLES (JSON):\n{json.dumps(compact, ensure_ascii=False)}\n\n"
        "Analyse l'adéquation (compétences, expérience, domaine d'études, localisation, langues). "
        "Sélectionne et classe uniquement les offres réellement pertinentes (maximum 10). "
        "Réponds UNIQUEMENT avec un objet JSON brut (sans backticks) avec la clé \"recommendations\": "
        "un tableau d'objets {\"id\": <id exact de l'offre>, \"score\": <entier 0-100>, "
        "\"reason\": <phrase courte en français expliquant la correspondance>}. "
        "Classe du meilleur au moins bon."
    )
    try:
        client = AsyncOpenAI(api_key=api_key)
        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Tu es un assistant de matching d'offres. Réponds uniquement en JSON valide."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
    except Exception as e:
        logger.error("AI recommendation failed: %s", e)
        return []

    valid_ids = {p["id"] for p in pools}
    out = []
    for r in data.get("recommendations", []) or []:
        rid = str(r.get("id"))
        if rid not in valid_ids:
            continue
        try:
            score = max(0, min(100, int(round(float(r.get("score", 0))))))
        except Exception:
            score = 0
        out.append({"pool_id": rid, "score": score, "reason": (r.get("reason") or "").strip()})
    return out


@router.post("/recommendations")
async def recommendations(current=Depends(get_current_candidate)):
    """AI-ranked offer recommendations based on the candidate's profile + CV."""
    supabase = get_supabase()
    profile = _fetch_profile(current["id"]) or {}
    pools = _fetch_active_pools(supabase)
    if not pools:
        return {"recommendations": [], "used_ai": False, "used_cv": False}

    profile_text = _profile_to_text(profile, current["email"])
    cv_text = _extract_cv_text(supabase, current["id"])
    recs = await _ai_rank(profile_text, cv_text, pools)
    return {"recommendations": recs, "used_ai": bool(recs), "used_cv": bool(cv_text)}


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
