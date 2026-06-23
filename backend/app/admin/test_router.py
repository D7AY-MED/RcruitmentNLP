"""
Hermetic tests for the administrator endpoints.

Run without pytest:
    python -m app.admin.test_router
(the file's __main__ block runs the suite and asserts).

Also runnable under pytest if it is installed:
    pytest backend/app/admin/test_router.py

Uses FastAPI's TestClient (httpx) so no server or database is required. We
mount ONLY the admin router on a throwaway FastAPI app: the admin endpoints
here are DB-free, so this is hermetic and correctly scoped.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.admin.router import router as admin_router

app = FastAPI()
app.include_router(admin_router)
client = TestClient(app)


def test_health():
    resp = client.get("/api/v1/admin/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "admin"


def test_capabilities():
    resp = client.get("/api/v1/admin/capabilities")
    assert resp.status_code == 200
    body = resp.json()
    assert body["service"] == "admin"
    # User-management actions are served by FastAPI.
    um = body["user_management"]
    assert um["served_by"] == "fastapi"
    assert "create_recruiter" in um["actions"]
    assert "create_candidate" in um["actions"]
    assert "dashboard_stats" in um["actions"]
    # Backend feature bucket exists (may be empty for now).
    assert body["backend_features"]["served_by"] == "fastapi"
    assert isinstance(body["backend_features"]["actions"], list)


def _run_all():
    tests = [test_health, test_capabilities]
    for t in tests:
        t()
        print(f"PASS {t.__name__}")


if __name__ == "__main__":
    _run_all()
    print("\nAll admin tests passed.")
