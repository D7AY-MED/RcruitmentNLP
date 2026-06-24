"""
Admin authorization dependency.

Resolves the bearer token to an admin profile, or 403. Both steps go through the
performance layer in ``app.admin.security``:

* token -> user id : **local** JWKS verification (no network per request), with a
  network fallback for safety. See ``security.verify_admin_token``.
* user id -> admin : ``admin_profiles`` membership, cached briefly.

This keeps the admin module self-contained for the *role* decision while reusing
the same tokens as the rest of the app (this is not an auth rewrite). Usage::

    @router.get("/things")
    def list_things(admin: dict = Depends(get_current_admin)):
        ...
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.admin.security import get_admin_profile, verify_admin_token

bearer_scheme = HTTPBearer()


async def get_current_admin(credentials=Depends(bearer_scheme)) -> dict:
    """Resolve the caller to an admin profile, or raise 401/403."""
    user_id = verify_admin_token(credentials.credentials)
    admin = get_admin_profile(user_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an administrator.",
        )
    return admin
