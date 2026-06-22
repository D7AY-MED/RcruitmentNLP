import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas_candidate import CandidateLogin, CandidateOut, CandidateRegister, CandidateToken
from app.security_candidate import create_candidate_token, get_current_candidate
from app.supabase_auth import get_user, login_user, register_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/candidate", tags=["candidate"])


@router.get("/health")
async def health():
    logger.info("candidate health ok")
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


def _candidate_out_from_supabase(sb_user: dict) -> CandidateOut:
    meta = sb_user.get("user_metadata", {}) or {}
    return CandidateOut(
        id=sb_user["id"],
        full_name=meta.get("full_name", ""),
        email=sb_user["email"],
        phone=meta.get("phone"),
        created_at=sb_user.get("created_at", ""),
    )


@router.post("/register", response_model=CandidateToken, status_code=status.HTTP_201_CREATED)
def register(payload: CandidateRegister):
    try:
        sb_user = register_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    token = create_candidate_token(
        candidate_id=sb_user["id"],
        email=sb_user["email"],
        full_name=(sb_user.get("user_metadata") or {}).get("full_name", payload.full_name),
    )
    return CandidateToken(
        access_token=token,
        candidate=_candidate_out_from_supabase(sb_user),
    )


@router.post("/login", response_model=CandidateToken)
def login(payload: CandidateLogin):
    try:
        sb_session = login_user(email=payload.email, password=payload.password)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    sb_user = sb_session.get("user", {})
    meta = sb_user.get("user_metadata", {}) or {}
    token = create_candidate_token(
        candidate_id=sb_user["id"],
        email=sb_user["email"],
        full_name=meta.get("full_name", ""),
    )
    return CandidateToken(
        access_token=token,
        candidate=_candidate_out_from_supabase(sb_user),
    )


@router.get("/me", response_model=CandidateOut)
def me(current=Depends(get_current_candidate)):
    sb_user = get_user(current["id"])
    if sb_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _candidate_out_from_supabase(sb_user)
