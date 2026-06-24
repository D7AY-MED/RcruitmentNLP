"""Repository for Supabase Auth admin operations.

This is the only repository that does not own a database table -- it wraps the
GoTrue (Supabase Auth) admin API. We use it to create/delete auth users, reset
passwords, and -- crucially -- to "disable" a user by *banning* them, since the
profile tables have no status/disabled column and the spec forbids schema
changes.

Create/delete/password go through the typed supabase-py client (proven in the
legacy code). Ban/unban and reading ``banned_until`` go through the raw GoTrue
REST endpoint via httpx, because the typed client does not surface those fields.
"""

from __future__ import annotations

from typing import Optional

import httpx

from app.admin.cache import TTLCache
from app.auth import get_supabase
from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

# An effectively-permanent ban. GoTrue accepts a Go duration string.
_FOREVER = "876000h"  # ~100 years

# The disabled/banned map is an expensive GoTrue paged sweep that the Users list
# needs on every load. Disabled status changes rarely, so cache it briefly and
# invalidate explicitly when an admin bans/unbans a user.
_DISABLED_CACHE = TTLCache(ttl=30.0)
_DISABLED_KEY = "all"


class AuthRepository:
    def __init__(self) -> None:
        self.client = get_supabase()
        self._base = f"{SUPABASE_URL}/auth/v1/admin/users"
        self._headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        }

    # --- account lifecycle ---------------------------------------------------

    def create_user(self, email: str, password: str, metadata: Optional[dict] = None) -> str:
        """Create an auth user (email pre-confirmed). Returns the new user id."""
        created = self.client.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata or {},
            }
        )
        return created.user.id

    def delete_user(self, user_id: str) -> None:
        """Delete an auth user. Tolerant of an already-deleted user."""
        try:
            self.client.auth.admin.delete_user(user_id)
        except Exception as exc:  # noqa: BLE001 -- idempotent delete
            if "not found" not in str(exc).lower():
                raise

    def set_password(self, user_id: str, password: str) -> None:
        self.client.auth.admin.update_user_by_id(user_id, {"password": password})

    def sign_in(self, email: str, password: str):
        """Password sign-in. Returns the supabase auth session response."""
        return self.client.auth.sign_in_with_password({"email": email, "password": password})

    # --- enable / disable via ban -------------------------------------------

    def ban_user(self, user_id: str) -> None:
        self._patch(user_id, {"ban_duration": _FOREVER})
        _DISABLED_CACHE.invalidate(_DISABLED_KEY)

    def unban_user(self, user_id: str) -> None:
        self._patch(user_id, {"ban_duration": "none"})
        _DISABLED_CACHE.invalidate(_DISABLED_KEY)

    def get_auth_user(self, user_id: str) -> dict:
        """Return the raw GoTrue user record (includes ``banned_until``)."""
        with httpx.Client(timeout=10) as http:
            resp = http.get(f"{self._base}/{user_id}", headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    def is_disabled(self, user_id: str) -> bool:
        """True when the user is currently banned (i.e. disabled)."""
        try:
            data = self.get_auth_user(user_id)
        except httpx.HTTPError:
            return False
        banned_until = data.get("banned_until")
        return bool(banned_until)

    def disabled_map(self) -> dict[str, bool]:
        """Return {user_id: is_disabled} for all auth users, in one paged sweep.

        Used by the users list so disabled badges are accurate without an auth
        call per row. Pages through the GoTrue admin users endpoint. Cached for
        30s (invalidated on ban/unban) because it is expensive and rarely changes.
        """
        cached = _DISABLED_CACHE.get(_DISABLED_KEY)
        if cached is not None:
            return cached

        result: dict[str, bool] = {}
        page = 1
        with httpx.Client(timeout=15) as http:
            while True:
                resp = http.get(
                    self._base,
                    headers=self._headers,
                    params={"page": page, "per_page": 1000},
                )
                resp.raise_for_status()
                users = resp.json().get("users", [])
                if not users:
                    break
                for u in users:
                    result[u.get("id")] = bool(u.get("banned_until"))
                if len(users) < 1000:
                    break
                page += 1
        _DISABLED_CACHE.set(_DISABLED_KEY, result)
        return result

    def _patch(self, user_id: str, body: dict) -> None:
        with httpx.Client(timeout=10) as http:
            resp = http.put(f"{self._base}/{user_id}", headers=self._headers, json=body)
            resp.raise_for_status()
