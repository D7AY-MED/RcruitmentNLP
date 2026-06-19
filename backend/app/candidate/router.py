"""
Candidate endpoints (DEMO).

Mounted under the /api/v1/candidate prefix. The /apply frontend page is
currently a static demo with no backend call; this router exists as the home
for candidate-facing endpoints (CV upload, AI interview submission, pool
lookup) that will be added once the real feature is wired to recruiter links.
"""

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/candidate", tags=["candidate"])


@router.get("/health")
async def health():
    """Liveness check for the candidate service area."""
    logger.info("candidate health ok")
    return {"status": "ok", "service": "candidate"}


@router.get("/offer/demo")
async def get_demo_offer():
    """Return a static demo offer matching the Jobzyn page structure.

    Provides the same mock data consumed by the /apply frontend page so that
    the page can later switch from hardcoded constants to a real API call
    without changing its rendering logic.
    """
    logger.info("serving demo offer")
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
