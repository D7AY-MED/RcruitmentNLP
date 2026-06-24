"""Tests for the input validators (pure functions, no DB)."""

import pytest
from fastapi import HTTPException

from app.admin import validators


def test_validate_user_type_accepts_known():
    assert validators.validate_user_type("candidate") == "candidate"
    assert validators.validate_user_type("recruiter") == "recruiter"


def test_validate_user_type_rejects_admin():
    # Admins are managed in Settings, never via the Users area.
    with pytest.raises(HTTPException) as exc:
        validators.validate_user_type("admin")
    assert exc.value.status_code == 400


@pytest.mark.parametrize("dataset", ["users", "candidates", "jobs", "applications", "companies"])
def test_validate_dataset_ok(dataset):
    assert validators.validate_dataset(dataset) == dataset


def test_validate_dataset_bad():
    with pytest.raises(HTTPException):
        validators.validate_dataset("nope")


def test_validate_format():
    assert validators.validate_format("csv") == "csv"
    assert validators.validate_format("xlsx") == "xlsx"
    with pytest.raises(HTTPException):
        validators.validate_format("pdf")


def test_require_non_empty():
    assert validators.require_non_empty("x", "field") == "x"
    with pytest.raises(HTTPException):
        validators.require_non_empty("  ", "field")
