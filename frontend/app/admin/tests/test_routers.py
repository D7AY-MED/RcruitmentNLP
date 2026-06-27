"""Router wiring smoke tests using FastAPI's TestClient.

We build a minimal app that mounts the admin router, override the admin auth
dependency so requests are authorised, and monkeypatch the relevant service
method so no database is touched. This proves the View layer is wired correctly
to the Controller layer.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.admin import router as admin_router
from app.admin.permissions import get_current_admin
from app.admin.schemas.dashboard_schemas import AdminStats
from app.admin.services import DashboardService, UserService


def _client(monkeypatch=None):
    app = FastAPI()
    app.include_router(admin_router)
    app.dependency_overrides[get_current_admin] = lambda: {"id": "admin-1", "full_name": "Root",
                                                           "email": "root@x.com", "created_at": "t"}
    return TestClient(app)


def test_health_is_open():
    client = _client()
    resp = client.get("/api/v1/admin/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "admin"


def test_dashboard_stats_wired(monkeypatch):
    fake = AdminStats(recruiters=1, candidates=2, pools=3, activePools=1,
                      companies=1, applications=4, completedApplications=2, summaries=1)
    monkeypatch.setattr(DashboardService, "stats", lambda self: fake)
    client = _client()
    resp = client.get("/api/v1/admin/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["candidates"] == 2
    assert body["applications"] == 4


def test_users_list_wired(monkeypatch):
    # The list endpoint is paginated and returns an envelope.
    monkeypatch.setattr(UserService, "list_users",
                        lambda self, search=None, user_type=None, page=1, page_size=25: {
                            "items": [{"id": "c1", "type": "candidate", "full_name": "Alice",
                                       "email": "a@x.com", "disabled": False}],
                            "total": 1, "page": page, "page_size": page_size, "pages": 1,
                        })
    client = _client()
    resp = client.get("/api/v1/admin/users")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["full_name"] == "Alice"


def test_reports_export_rejects_bad_dataset():
    client = _client()
    resp = client.get("/api/v1/admin/reports/export?dataset=bogus&format=csv")
    assert resp.status_code == 400
