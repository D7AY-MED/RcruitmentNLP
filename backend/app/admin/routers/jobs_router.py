"""Job (job_pools) endpoints. Paths under /api/v1/admin/jobs."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status

from app.admin.permissions import get_current_admin
from app.admin.schemas.job_schemas import JobUpdate
from app.admin.services import JobService

router = APIRouter(prefix="/jobs", tags=["admin:jobs"])


@router.get("")
async def list_jobs(search: str | None = None, status: str | None = None,
                    _admin: dict = Depends(get_current_admin)):
    return JobService().list_jobs(search=search, status_filter=status)


@router.get("/{pool_id}")
async def get_job(pool_id: str, _admin: dict = Depends(get_current_admin)):
    return JobService().get_job(pool_id)


@router.patch("/{pool_id}")
async def update_job(pool_id: str, payload: JobUpdate, _admin: dict = Depends(get_current_admin)):
    return JobService().update_job(pool_id, payload.model_dump(exclude_unset=True))


@router.delete("/{pool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(pool_id: str, _admin: dict = Depends(get_current_admin)):
    JobService().delete_job(pool_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
