"""Reusable input validators for the admin services.

Small, pure helpers that raise ``HTTPException`` on bad input so services can
fail fast with a clean 4xx instead of letting a bad value reach the database.
"""

from __future__ import annotations

from fastapi import HTTPException, status

#: User kinds the admin area manages (admins are NOT managed here -- Settings).
USER_TYPES = {"candidate", "recruiter"}

#: Datasets the report export endpoint understands.
REPORT_DATASETS = {"users", "candidates", "recruiters", "companies", "jobs", "applications"}

#: Export file formats.
EXPORT_FORMATS = {"csv", "xlsx"}


def validate_user_type(user_type: str) -> str:
    if user_type not in USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown user type '{user_type}'. Expected one of {sorted(USER_TYPES)}.",
        )
    return user_type


def validate_dataset(dataset: str) -> str:
    if dataset not in REPORT_DATASETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown dataset '{dataset}'. Expected one of {sorted(REPORT_DATASETS)}.",
        )
    return dataset


def validate_format(fmt: str) -> str:
    if fmt not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown format '{fmt}'. Expected one of {sorted(EXPORT_FORMATS)}.",
        )
    return fmt


def require_non_empty(value: str, field: str) -> str:
    if not value or not str(value).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{field}' is required.",
        )
    return value
