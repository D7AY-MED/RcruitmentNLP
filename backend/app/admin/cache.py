"""
Tiny in-process TTL cache used by the admin module's performance layer.

Deliberately dependency-free and thread-safe. Two helpers:

* ``TTLCache`` — a key/value store whose entries expire after ``ttl`` seconds.
* ``ttl_cached`` — a decorator that memoizes a function's result by its
  arguments for ``ttl`` seconds (used for expensive read-only aggregates).

Why this exists: every admin request used to re-do the same heavy work (token
verification, admin-profile lookups, full-table aggregate scans). Caching the
read-only pieces for a few seconds collapses repeated work without changing any
behaviour the admin can observe (staleness is bounded and small, and mutating
endpoints invalidate the relevant caches).
"""

from __future__ import annotations

import threading
import time
from typing import Any, Callable, Optional


class TTLCache:
    """A minimal thread-safe time-to-live cache."""

    def __init__(self, ttl: float) -> None:
        self.ttl = ttl
        self._store: dict[Any, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: Any) -> Optional[Any]:
        now = time.monotonic()
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at < now:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: Any, value: Any) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + self.ttl, value)

    def invalidate(self, key: Any) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


def ttl_cached(ttl: float) -> Callable:
    """Memoize a function by its positional args for ``ttl`` seconds.

    Intended for read-only service aggregates (dashboard, reports). The wrapped
    function gets a ``.cache_clear()`` attribute for invalidation after writes.
    """

    cache = TTLCache(ttl)

    def decorator(fn: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Skip the bound ``self`` (first arg) so all instances share results.
            key = (args[1:], tuple(sorted(kwargs.items())))
            hit = cache.get(key)
            if hit is not None:
                return hit
            result = fn(*args, **kwargs)
            cache.set(key, result)
            return result

        wrapper.cache_clear = cache.clear  # type: ignore[attr-defined]
        return wrapper

    return decorator
