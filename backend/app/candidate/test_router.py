"""
Hermetic tests for the candidate demo endpoints.

Run without pytest:
    python -m app.candidate.test_router
(the file's __main__ block runs the suite and asserts).

Also runnable under pytest if it is installed:
    pytest backend/app/candidate/test_router.py

Uses FastAPI's TestClient (httpx) so no server or database is required. We
mount ONLY the candidate router on a throwaway FastAPI app: the candidate
endpoints are DB-free, so this is hermetic and correctly scoped.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.candidate.router import router as candidate_router

app = FastAPI()
app.include_router(candidate_router)
client = TestClient(app)


def test_health():
    resp = client.get("/api/v1/candidate/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "candidate"


def test_demo_offer():
    resp = client.get("/api/v1/candidate/offer/demo")
    assert resp.status_code == 200
    body = resp.json()
    # Verify required top-level fields
    assert body["title"] == "Sr Consultant Transaction Services"
    assert body["company_name"] == "PooLink Confidential"
    assert body["location"] == "Casablanca"
    assert body["contract_type"] == "CDI"
    assert "salary_range" in body
    assert "experience_level" in body
    # Verify nested sections structure
    sections = body["sections"]
    assert isinstance(sections["about"], str)
    assert isinstance(sections["missions"], list) and len(sections["missions"]) > 0
    assert isinstance(sections["profile"], list) and len(sections["profile"]) > 0
    assert isinstance(sections["benefits"], list) and len(sections["benefits"]) > 0


def _run_all():
    tests = [test_health, test_demo_offer]
    for t in tests:
        t()
        print(f"PASS {t.__name__}")


if __name__ == "__main__":
    _run_all()
    print("\nAll candidate tests passed.")
