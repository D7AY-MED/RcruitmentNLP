"""Settings business rules: admin users, own profile, security.

This is the ONLY place admins themselves are managed (they are excluded from the
Users area). Guards protect against an admin deleting their own account or
removing the last remaining administrator.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status

from app.admin.repositories import AdminRepository, AuthRepository
from app.auth import parse_datetime


def _public_admin(row: dict) -> dict:
    """Strip sensitive columns (e.g. password) before returning an admin row."""
    return {
        "id": row.get("id"),
        "full_name": row.get("full_name"),
        "email": row.get("email"),
        "created_at": row.get("created_at"),
    }


class SettingsService:
    def __init__(self) -> None:
        self.admins = AdminRepository()
        self.auth = AuthRepository()

    # --- admin users ---------------------------------------------------------

    def list_admins(self) -> list[dict]:
        return [_public_admin(a) for a in self.admins.list_all()]

    def create_admin(self, full_name: str, email: str, password: str) -> dict:
        try:
            user_id = self.auth.create_user(email, password, {"full_name": full_name, "role": "admin"})
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            duplicate = "already" in msg or "exist" in msg
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT if duplicate else status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists." if duplicate else msg,
            )
        try:
            row = self.admins.upsert({"id": user_id, "full_name": full_name, "email": email})
        except Exception as exc:  # noqa: BLE001
            self.auth.delete_user(user_id)
            raise HTTPException(status_code=500, detail=f"Admin profile creation failed: {exc}")
        return _public_admin(row)

    def delete_admin(self, admin_id: str, current_admin_id: str) -> None:
        if str(admin_id) == str(current_admin_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="You cannot delete your own admin account.")
        if not self.admins.get(admin_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found.")
        if self.admins.count() <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Cannot remove the last administrator.")
        self.admins.delete(admin_id)
        self.auth.delete_user(admin_id)

    # --- my profile ----------------------------------------------------------

    def update_profile(self, admin_id: str, full_name: str | None) -> dict:
        data = {}
        if full_name is not None:
            data["full_name"] = full_name
        if not data:
            row = self.admins.get(admin_id)
        else:
            row = self.admins.update(admin_id, data)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found.")
        return _public_admin(row)

    # --- security ------------------------------------------------------------

    def change_password(self, admin_id: str, new_password: str) -> dict:
        try:
            self.auth.set_password(admin_id, new_password)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Password change failed: {exc}")
        return {"message": "Password updated.", "ok": True}

    # --- api keys (placeholder) ---------------------------------------------

    @staticmethod
    def api_keys() -> dict:
        """API keys would require a dedicated table; none exists and the spec
        forbids creating one. Return a placeholder the UI renders as 'coming soon'."""
        return {
            "supported": False,
            "message": "API key management requires database support that is not part of "
                       "the current schema. This section is a placeholder.",
            "keys": [],
        }
