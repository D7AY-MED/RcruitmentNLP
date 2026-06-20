"""Administrator-facing package.

Self-contained module for the platform administrator experience (mirrors the
`candidate` package). Exposes admin service endpoints under /api/v1/admin.

The heavy lifting for admin user management (creating recruiters/candidates,
listing and deleting users) is currently done in the Next.js BFF API routes
(frontend/app/api/admin/*) using the Supabase service-role key, exactly like
the recruiter and candidate flows. This package is the home for admin endpoints
that need to live on the FastAPI backend (analytics, audit trails, batch jobs).
"""
