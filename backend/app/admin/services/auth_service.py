"""Authentication business rules for the admin area.

Login: sign in via Supabase Auth, then gate on admin_profiles membership.
Register: bootstrap the first admin, guarded by ADMIN_SETUP_TOKEN.

Token verification itself lives in ``app.auth`` and is reused; this service only
adds the admin-specific rules on top.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status

from app.admin.repositories import AdminRepository, AuthRepository
from app.admin.schemas.auth_schemas import AdminOut, AdminToken
from app.auth import parse_datetime
from app.config import ADMIN_SETUP_TOKEN


def _to_admin_out(row: dict) -> AdminOut:
    raw_id = row["id"]
    return AdminOut(
        id=UUID(raw_id) if isinstance(raw_id, str) else raw_id,
        full_name=row["full_name"],
        email=row["email"],
        created_at=parse_datetime(row.get("created_at")),
    )


class AuthService:
    def __init__(self) -> None:
        self.admins = AdminRepository()
        self.auth = AuthRepository()

    def login(self, email: str, password: str) -> AdminToken:
        try:
            session = self.auth.sign_in(email, password)
        except Exception:  # noqa: BLE001 -- supabase raises various auth errors
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        user_id = session.user.id
        # Re-read the admin profile with a fresh service-role client (the sign-in
        # above mutated the shared client's auth state).
        admin = AdminRepository().get(user_id)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is not an administrator.",
            )

        return AdminToken(
            access_token=session.session.access_token,
            token_type="bearer",
            admin=_to_admin_out(admin),
        )

    def register(self, full_name: str, email: str, password: str, setup_token: str | None) -> AdminToken:
        if not ADMIN_SETUP_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin bootstrap is disabled. Set ADMIN_SETUP_TOKEN to enable it.",
            )
        if setup_token != ADMIN_SETUP_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid setup token.",
            )

        try:
            user_id = self.auth.create_user(
                email, password, {"full_name": full_name, "role": "admin"}
            )
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            duplicate = "already" in msg or "exist" in msg
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT if duplicate else status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists." if duplicate else msg,
            )

        try:
            self.admins.upsert({"id": user_id, "full_name": full_name, "email": email})
        except Exception as exc:  # noqa: BLE001 -- roll back the auth user
            self.auth.delete_user(user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Admin profile creation failed: {exc}",
            )

        session = self.auth.sign_in(email, password)
        return AdminToken(
            access_token=session.session.access_token,
            token_type="bearer",
            admin=_to_admin_out({"id": user_id, "full_name": full_name, "email": email}),
        )

    @staticmethod
    def me(admin_row: dict) -> AdminOut:
        return _to_admin_out(admin_row)
