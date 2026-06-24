"""User-management business rules.

The Users area is a *unified* view over two tables -- candidate_profiles and
hr_profiles -- presented as one list with a ``type`` discriminator. Admins are
deliberately excluded (they live under Settings -> Admin Users).

Supported actions, only where the existing system allows them:
  - list (search + type filter + disabled status)
  - get (full detail)
  - create (candidate or recruiter)
  - update (any editable column)
  - disable / enable (via Supabase Auth ban -- no schema column exists)
  - delete (profile row + auth user)
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.admin.repositories import (
    CandidateRepository,
    HrRepository,
    AuthRepository,
)
from app.admin.validators import validate_user_type


class UserService:
    def __init__(self) -> None:
        self.candidates = CandidateRepository()
        self.recruiters = HrRepository()
        self.auth = AuthRepository()

    # --- read ----------------------------------------------------------------

    def list_users(
        self,
        search: str | None = None,
        user_type: str | None = None,
        page: int = 1,
        page_size: int = 25,
    ) -> dict:
        """Combined, paginated user list across candidates and recruiters.

        Returns an envelope ``{items, total, page, page_size, pages}``. Uses the
        lightweight column projection (``list_basic``) so only display fields are
        fetched, and disabled status comes from a single cached GoTrue sweep.
        """
        disabled = self.auth.disabled_map()
        rows: list[dict] = []

        if user_type in (None, "candidate"):
            for c in self.candidates.list_basic():
                rows.append(self._normalise(c, "candidate", disabled))
        if user_type in (None, "recruiter"):
            for r in self.recruiters.list_basic():
                rows.append(self._normalise(r, "recruiter", disabled))

        if search:
            needle = search.lower().strip()
            rows = [
                u for u in rows
                if needle in (u.get("full_name") or "").lower()
                or needle in (u.get("email") or "").lower()
                or needle in (u.get("company_name") or "").lower()
            ]

        rows.sort(key=lambda u: u.get("created_at") or "", reverse=True)

        total = len(rows)
        page = max(1, page)
        page_size = max(1, min(page_size, 200))
        start = (page - 1) * page_size
        items = rows[start:start + page_size]
        pages = (total + page_size - 1) // page_size if total else 1

        return {"items": items, "total": total, "page": page,
                "page_size": page_size, "pages": pages}

    def get_user(self, user_type: str, user_id: str) -> dict:
        validate_user_type(user_type)
        row = self._repo(user_type).get(user_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        disabled = {user_id: self.auth.is_disabled(user_id)}
        return self._normalise(row, user_type, disabled, full=True)

    # --- write ---------------------------------------------------------------

    def create_candidate(self, full_name: str, email: str, password: str, phone: str | None) -> dict:
        user_id = self._create_auth_user(email, password, {"full_name": full_name, "phone": phone})
        try:
            row = self.candidates.upsert({
                "id": user_id, "full_name": full_name, "email": email, "phone": phone,
            })
        except Exception as exc:  # noqa: BLE001 -- roll back the auth user
            self.auth.delete_user(user_id)
            raise HTTPException(status_code=500, detail=f"Profile creation failed: {exc}")
        return self._normalise(row, "candidate", {user_id: False})

    def create_recruiter(self, full_name: str, email: str, password: str,
                         company_name: str, phone: str | None) -> dict:
        user_id = self._create_auth_user(
            email, password, {"full_name": full_name, "company_name": company_name, "phone": phone}
        )
        try:
            row = self.recruiters.upsert({
                "id": user_id, "full_name": full_name, "email": email,
                "company_name": company_name, "phone": phone,
            })
        except Exception as exc:  # noqa: BLE001
            self.auth.delete_user(user_id)
            raise HTTPException(status_code=500, detail=f"Profile creation failed: {exc}")
        return self._normalise(row, "recruiter", {user_id: False})

    def update_user(self, user_type: str, user_id: str, data: dict) -> dict:
        validate_user_type(user_type)
        clean = {k: v for k, v in data.items() if v is not None}
        if not clean:
            return self.get_user(user_type, user_id)
        row = self._repo(user_type).update(user_id, clean)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return self._normalise(row, user_type, {user_id: self.auth.is_disabled(user_id)}, full=True)

    def set_disabled(self, user_type: str, user_id: str, disabled: bool) -> dict:
        validate_user_type(user_type)
        if not self._repo(user_type).get(user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if disabled:
            self.auth.ban_user(user_id)
        else:
            self.auth.unban_user(user_id)
        return {"id": user_id, "type": user_type, "disabled": disabled}

    def delete_user(self, user_type: str, user_id: str) -> None:
        validate_user_type(user_type)
        # Delete the profile row first (safe), then the auth user.
        self._repo(user_type).delete(user_id)
        self.auth.delete_user(user_id)

    # --- helpers -------------------------------------------------------------

    def _repo(self, user_type: str):
        return self.candidates if user_type == "candidate" else self.recruiters

    def _create_auth_user(self, email: str, password: str, metadata: dict) -> str:
        try:
            return self.auth.create_user(email, password, metadata)
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            duplicate = "already" in msg or "exist" in msg
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT if duplicate else status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists." if duplicate else msg,
            )

    @staticmethod
    def _normalise(row: dict, user_type: str, disabled: dict[str, bool], full: bool = False) -> dict:
        """Project a raw profile row into the shape the frontend table expects."""
        out = {
            "id": row.get("id"),
            "type": user_type,
            "full_name": row.get("full_name"),
            "email": row.get("email"),
            "phone": row.get("phone"),
            "company_name": row.get("company_name"),
            "created_at": row.get("created_at"),
            "disabled": disabled.get(row.get("id"), False),
        }
        if full:
            # Include the entire row so the detail drawer can show/edit everything.
            out["profile"] = row
        return out
