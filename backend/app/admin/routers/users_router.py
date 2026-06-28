"""User-management endpoints (candidates + recruiters, unified).

Paths under /api/v1/admin/users. The ``user_type`` path segment is 'candidate'
or 'recruiter' (validated in the service). Admins are NOT managed here.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status

from app.admin.permissions import get_current_admin
from app.admin.schemas.common import MessageOut
from app.admin.schemas.user_schemas import (
    CandidateCreate,
    CandidateUpdate,
    PasswordSet,
    RecruiterCreate,
    RecruiterUpdate,
)
from app.admin.services import UserService

router = APIRouter(prefix="/users", tags=["admin:users"])


@router.get("")
async def list_users(search: str | None = None, type: str | None = None,
                     page: int = 1, page_size: int = 25,
                     _admin: dict = Depends(get_current_admin)):
    return UserService().list_users(search=search, user_type=type, page=page, page_size=page_size)


@router.get("/{user_type}/{user_id}")
async def get_user(user_type: str, user_id: str, _admin: dict = Depends(get_current_admin)):
    return UserService().get_user(user_type, user_id)


@router.post("/candidate", status_code=status.HTTP_201_CREATED)
async def create_candidate(payload: CandidateCreate, _admin: dict = Depends(get_current_admin)):
    return UserService().create_candidate(
        payload.full_name, payload.email, payload.password, payload.phone
    )


@router.post("/recruiter", status_code=status.HTTP_201_CREATED)
async def create_recruiter(payload: RecruiterCreate, _admin: dict = Depends(get_current_admin)):
    return UserService().create_recruiter(
        payload.full_name, payload.email, payload.password, payload.company_name, payload.phone
    )


@router.put("/candidate/{user_id}")
async def update_candidate(user_id: str, payload: CandidateUpdate,
                           _admin: dict = Depends(get_current_admin)):
    return UserService().update_user("candidate", user_id, payload.model_dump(exclude_unset=True))


@router.put("/recruiter/{user_id}")
async def update_recruiter(user_id: str, payload: RecruiterUpdate,
                           _admin: dict = Depends(get_current_admin)):
    return UserService().update_user("recruiter", user_id, payload.model_dump(exclude_unset=True))


@router.post("/{user_type}/{user_id}/password", response_model=dict)
async def set_user_password(user_type: str, user_id: str, payload: PasswordSet,
                            _admin: dict = Depends(get_current_admin)):
    return UserService().set_password(user_type, user_id, payload.new_password)


@router.post("/{user_type}/{user_id}/disable", response_model=dict)
async def disable_user(user_type: str, user_id: str, _admin: dict = Depends(get_current_admin)):
    return UserService().set_disabled(user_type, user_id, True)


@router.post("/{user_type}/{user_id}/enable", response_model=dict)
async def enable_user(user_type: str, user_id: str, _admin: dict = Depends(get_current_admin)):
    return UserService().set_disabled(user_type, user_id, False)


@router.delete("/{user_type}/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_type: str, user_id: str, _admin: dict = Depends(get_current_admin)):
    UserService().delete_user(user_type, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
