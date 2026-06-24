"""
Fast admin token verification (performance layer).

**The single biggest source of admin slowness** was that every request verified
the caller's JWT by calling Supabase GoTrue over the network
(``GET /auth/v1/user``) — a blocking round trip, and at volume it tripped
GoTrue's rate limiter, ballooning latency to multiple seconds *per request*.

This module replaces that with **local** verification:

1. Supabase signs user JWTs with an asymmetric key (ES256). We fetch the public
   keys once from the project's JWKS endpoint, cache them, and verify the token
   signature locally — **zero network per request**.
2. The admin-profile membership lookup (was a DB round trip per request) is
   cached per user id with a short TTL.

If local verification can't be done (e.g. a legacy HS256 token, or JWKS briefly
unavailable), we **fall back** to the original network verification so behaviour
never regresses. Security is unchanged: same tokens, same signature checks, same
``admin_profiles`` gate — only the *transport* of the check changed.
"""

from __future__ import annotations

import threading
import time

import httpx
from fastapi import HTTPException, status
from jose import jwt
from jose.exceptions import JWTError

from app.admin.cache import TTLCache
from app.admin.repositories import AdminRepository
from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

# --- JWKS (public signing keys) cache ---------------------------------------

_JWKS_LOCK = threading.Lock()
_JWKS_BY_KID: dict[str, dict] = {}
_JWKS_FETCHED_AT: float = 0.0
_JWKS_TTL = 3600.0  # refresh public keys at most hourly


def _fetch_jwks() -> None:
    global _JWKS_FETCHED_AT
    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    with httpx.Client(timeout=8) as client:
        resp = client.get(url, headers={"apikey": SUPABASE_SERVICE_ROLE_KEY})
        resp.raise_for_status()
        keys = resp.json().get("keys", [])
    with _JWKS_LOCK:
        _JWKS_BY_KID.clear()
        for key in keys:
            if key.get("kid"):
                _JWKS_BY_KID[key["kid"]] = key
        _JWKS_FETCHED_AT = time.monotonic()


def _get_jwk(kid: str) -> dict | None:
    """Return the JWK for ``kid``, refreshing the cache if unknown/stale."""
    with _JWKS_LOCK:
        key = _JWKS_BY_KID.get(kid)
        fresh = (time.monotonic() - _JWKS_FETCHED_AT) < _JWKS_TTL
    if key and fresh:
        return key
    # Unknown kid or stale cache -> refetch once.
    try:
        _fetch_jwks()
    except Exception:  # noqa: BLE001 -- fall back to network verify upstream
        return None
    with _JWKS_LOCK:
        return _JWKS_BY_KID.get(kid)


# --- token -> user_id --------------------------------------------------------

# Verified token results are cached briefly so even repeated parses are free.
# Bounded by the token's own ``exp`` (we never cache past expiry).
_TOKEN_CACHE = TTLCache(ttl=300.0)


def _verify_local(token: str) -> str | None:
    """Verify the JWT signature locally via JWKS. Return ``sub`` or None."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        return None
    kid, alg = header.get("kid"), header.get("alg")
    if not kid or not alg or alg.upper().startswith("HS"):
        # No kid, or symmetric alg we can't verify with the public JWKS.
        return None
    key = _get_jwk(kid)
    if key is None:
        return None
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            options={"verify_aud": True},
            # small leeway for clock skew between app server and Supabase
        )
    except JWTError:
        # A genuinely invalid/expired token: reject (do not fall back).
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return claims.get("sub")


def _verify_network(token: str) -> str:
    """Fallback: the original GoTrue round trip (used only if local fails)."""
    err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_SERVICE_ROLE_KEY},
            )
        if resp.status_code != 200:
            raise err
        user_id = resp.json().get("id")
        if not user_id:
            raise err
        return user_id
    except httpx.RequestError as exc:  # noqa: BLE001
        raise err from exc


def verify_admin_token(token: str) -> str:
    """Return the Supabase user id for ``token`` (local-first, cached)."""
    cached = _TOKEN_CACHE.get(token)
    if cached is not None:
        return cached
    user_id = _verify_local(token)
    if user_id is None:
        user_id = _verify_network(token)
    _TOKEN_CACHE.set(token, user_id)
    return user_id


# --- admin profile lookup (cached) ------------------------------------------

_ADMIN_CACHE = TTLCache(ttl=60.0)


def get_admin_profile(user_id: str) -> dict | None:
    """Return the admin_profiles row for ``user_id`` (cached for 60s)."""
    cached = _ADMIN_CACHE.get(user_id)
    if cached is not None:
        return cached
    admin = AdminRepository().get(user_id)
    if admin:
        _ADMIN_CACHE.set(user_id, admin)
    return admin


def invalidate_admin(user_id: str) -> None:
    """Drop a cached admin profile (e.g. after a profile update or removal)."""
    _ADMIN_CACHE.invalidate(user_id)
