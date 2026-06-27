"""Reporting endpoints: analytics summary + CSV/Excel export.

Paths under /api/v1/admin/reports. Export streams an in-memory file with the
correct content-type and a download filename.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.admin.permissions import get_current_admin
from app.admin.services import ReportService
from app.admin.validators import validate_dataset, validate_format

router = APIRouter(prefix="/reports", tags=["admin:reports"])

_MIME = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@router.get("/summary")
async def summary(_admin: dict = Depends(get_current_admin)):
    return ReportService().summary()


@router.get("/export")
async def export(dataset: str, format: str = "csv", _admin: dict = Depends(get_current_admin)):
    validate_dataset(dataset)
    validate_format(format)
    service = ReportService()
    payload = service.to_csv(dataset) if format == "csv" else service.to_xlsx(dataset)
    filename = f"xquesty-{dataset}.{format}"
    return Response(
        content=payload,
        media_type=_MIME[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
