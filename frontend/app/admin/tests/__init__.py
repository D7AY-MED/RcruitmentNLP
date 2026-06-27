"""Tests for the admin module.

These are fast unit tests that exercise the business rules (services,
validators, serialisation) without a live database. The Supabase client is
stubbed in ``conftest.py`` so repositories construct cleanly, and individual
tests inject fake repositories to drive the services.

Run from the backend/ directory:  python -m pytest app/admin/tests -q
"""
