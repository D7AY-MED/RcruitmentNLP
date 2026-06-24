"""Shared pytest fixtures and stubs for the admin tests."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest


@pytest.fixture(autouse=True)
def stub_supabase(monkeypatch):
    """Replace the Supabase client factory so repositories build without network.

    Every repository calls ``get_supabase`` in its constructor. The name is
    imported into each module's namespace, so we patch it where it is used. Tests
    that need data override the repository methods they call, so the mock client
    itself is never exercised.
    """
    factory = lambda: MagicMock()  # noqa: E731
    monkeypatch.setattr("app.auth.get_supabase", factory, raising=True)
    monkeypatch.setattr("app.admin.repositories.base.get_supabase", factory, raising=True)
    monkeypatch.setattr("app.admin.repositories.auth_repository.get_supabase", factory, raising=True)
    # The performance layer memoizes some read-only service methods across
    # instances. Tests inject different fake repos per case, so clear those
    # caches before each test to avoid one test's data leaking into the next.
    _clear_ttl_caches()
    yield


def _clear_ttl_caches():
    from app.admin.services import DashboardService, ApplicationService, ReportService
    for fn in (DashboardService.stats, DashboardService.charts, DashboardService.activity,
               ApplicationService.list_applications, ReportService.summary):
        clear = getattr(fn, "cache_clear", None)
        if clear:
            clear()
