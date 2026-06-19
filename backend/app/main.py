"""
FastAPI entrypoint.

Wires CORS, the recruiter auth router, and ensures DB tables exist at startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.database import init_db
from app.routers import recruiter

app = FastAPI(title="xQuesty Link API", version="0.1.0")

# Allow the Next.js frontend to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register recruiter auth routes (/api/recruiter/*).
app.include_router(recruiter.router)


@app.on_event("startup")
def on_startup():
    # Create the `recruiters` table if it does not exist yet.
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
