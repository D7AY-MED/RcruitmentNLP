"""
Base repository.

Centralises access to the Supabase service-role client so every concrete
repository shares one initialisation path. We reuse ``app.auth.get_supabase``
(the project-wide client factory) rather than re-implementing client creation --
this keeps the admin module consistent with the rest of the backend and avoids
an "auth rewrite".

The service-role key bypasses RLS, which is required for administrative reads
and writes across all users' rows.
"""

from __future__ import annotations

import threading

from app.auth import get_supabase

# A single shared service-role client for ALL data repositories.
#
# Previously every repository instance created a brand-new Supabase client, so a
# single service (which builds several repositories) spun up several clients and
# their underlying httpx pools per request -- pure overhead. Data repositories
# only ever use the service-role key for reads/writes (they never sign a user
# in), so sharing one client is safe and much faster. ``AuthRepository`` is
# intentionally NOT a BaseRepository: it keeps its own client because its
# sign-in mutates auth state.
_SHARED_CLIENT = None
_SHARED_LOCK = threading.Lock()


def get_shared_supabase():
    global _SHARED_CLIENT
    if _SHARED_CLIENT is None:
        with _SHARED_LOCK:
            if _SHARED_CLIENT is None:
                _SHARED_CLIENT = get_supabase()
    return _SHARED_CLIENT


class BaseRepository:
    """Common parent giving every repository the shared Supabase client."""

    #: Subclasses set this to the physical table name they own.
    table_name: str = ""

    def __init__(self) -> None:
        self.client = get_shared_supabase()

    @property
    def table(self):
        """Return a PostgREST query builder for this repository's table."""
        if not self.table_name:
            raise NotImplementedError("Repository must define `table_name`.")
        return self.client.table(self.table_name)
