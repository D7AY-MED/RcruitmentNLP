"""Tests for ApplicationService grouping/aggregation logic."""

from types import SimpleNamespace

from app.admin.services.application_service import ApplicationService


def _service_with(rows, candidates=None, pools=None):
    svc = ApplicationService()
    svc.interviews = SimpleNamespace(
        list_all=lambda: rows,
        list_for_session=lambda sid: [r for r in rows if r["session_id"] == sid],
    )
    svc.candidates = SimpleNamespace(
        list_all=lambda: candidates or [],
        get=lambda cid: next((c for c in (candidates or []) if c["id"] == cid), None),
    )
    svc.pools = SimpleNamespace(
        list_all=lambda: pools or [],
        get=lambda pid: next((p for p in (pools or []) if str(p["id"]) == str(pid)), None),
    )
    svc.summaries = SimpleNamespace(get_for_candidate=lambda cid: None)
    return svc


def test_rows_group_into_one_application_with_progress():
    rows = [
        {"candidate_id": "c1", "session_id": "s1", "pool_id": "p1", "sequence": 1,
         "question": "Q1", "answer": "A1", "session_status": "active", "timestamp": "2026-01-01T10:00:00"},
        {"candidate_id": "c1", "session_id": "s1", "pool_id": "p1", "sequence": 2,
         "question": "Q2", "answer": None, "session_status": "active", "timestamp": "2026-01-01T10:05:00"},
    ]
    svc = _service_with(rows,
                        candidates=[{"id": "c1", "full_name": "Alice"}],
                        pools=[{"id": "p1", "title": "Backend Dev"}])
    apps = svc.list_applications()
    assert len(apps) == 1
    app = apps[0]
    assert app["candidate_name"] == "Alice"
    assert app["pool_title"] == "Backend Dev"
    assert app["total_questions"] == 2
    assert app["answered"] == 1
    assert app["status"] == "active"


def test_completed_status_detected():
    rows = [
        {"candidate_id": "c1", "session_id": "s1", "pool_id": "p1", "sequence": 1,
         "question": "Q1", "answer": "A1", "session_status": "completed", "timestamp": "t1"},
    ]
    svc = _service_with(rows)
    assert svc.list_applications()[0]["status"] == "completed"


def test_status_filter():
    rows = [
        {"candidate_id": "c1", "session_id": "s1", "pool_id": "p1", "sequence": 1,
         "answer": "A", "session_status": "completed", "timestamp": "t1"},
        {"candidate_id": "c2", "session_id": "s2", "pool_id": "p1", "sequence": 1,
         "answer": None, "session_status": "active", "timestamp": "t2"},
    ]
    svc = _service_with(rows)
    assert len(svc.list_applications(status_filter="completed")) == 1
    assert len(svc.list_applications(status_filter="active")) == 1


def test_get_application_detail():
    rows = [
        {"candidate_id": "c1", "session_id": "s1", "pool_id": "p1", "sequence": 1,
         "question": "Q1", "answer": "A1", "session_status": "completed", "timestamp": "t1", "name": "Alice"},
    ]
    svc = _service_with(rows, candidates=[{"id": "c1", "full_name": "Alice"}],
                        pools=[{"id": "p1", "title": "Backend"}])
    detail = svc.get_application("s1")
    assert detail["status"] == "completed"
    assert len(detail["questions"]) == 1
    assert detail["questions"][0]["question"] == "Q1"
