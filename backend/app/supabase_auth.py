import logging

import httpx

from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def _supabase_api(path: str) -> str:
    return f"{SUPABASE_URL}{path}"


def register_user(
    email: str,
    password: str,
    full_name: str,
    phone: str | None = None,
) -> dict:
    body = {
        "email": email,
        "password": password,
        "user_metadata": {"full_name": full_name},
        "email_confirm": True,
    }
    if phone:
        body["user_metadata"]["phone"] = phone

    resp = httpx.post(
        _supabase_api("/auth/v1/admin/users"),
        headers=_headers(),
        json=body,
        timeout=15,
    )

    if resp.is_error:
        detail = resp.json().get("msg", resp.text)
        logger.warning("Supabase Auth register failed: %s", detail)
        raise RuntimeError(detail)

    return resp.json()


def login_user(email: str, password: str) -> dict:
    resp = httpx.post(
        _supabase_api("/auth/v1/token?grant_type=password"),
        headers=_headers(),
        json={"email": email, "password": password},
        timeout=15,
    )

    if resp.is_error:
        detail = resp.json().get("error_description", resp.json().get("error", resp.text))
        logger.warning("Supabase Auth login failed: %s", detail)
        raise RuntimeError(detail)

    return resp.json()


def get_user(user_id: str) -> dict | None:
    resp = httpx.get(
        _supabase_api(f"/auth/v1/admin/users/{user_id}"),
        headers=_headers(),
        timeout=15,
    )

    if resp.is_error:
        logger.warning("Supabase Auth get_user failed: %s", resp.text)
        return None

    return resp.json()
