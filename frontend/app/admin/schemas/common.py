"""Shared, cross-cutting schemas."""

from __future__ import annotations

from pydantic import BaseModel


class MessageOut(BaseModel):
    """Generic success envelope for actions without a richer response."""

    message: str
    ok: bool = True
