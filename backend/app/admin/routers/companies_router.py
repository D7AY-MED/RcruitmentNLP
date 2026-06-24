"""Company endpoints (derived from hr_profiles). Paths under /api/v1/admin/companies."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.admin.permissions import get_current_admin
from app.admin.schemas.company_schemas import CompanyUpdate
from app.admin.services import CompanyService

router = APIRouter(prefix="/companies", tags=["admin:companies"])


@router.get("")
async def list_companies(search: str | None = None, _admin: dict = Depends(get_current_admin)):
    return CompanyService().list_companies(search=search)


@router.get("/{company_key}")
async def get_company(company_key: str, _admin: dict = Depends(get_current_admin)):
    return CompanyService().get_company(company_key)


@router.put("/{company_key}")
async def update_company(company_key: str, payload: CompanyUpdate,
                         _admin: dict = Depends(get_current_admin)):
    return CompanyService().update_company(company_key, payload.model_dump(exclude_unset=True))
