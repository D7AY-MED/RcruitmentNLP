"""
FastAPI entrypoint.

Wires CORS, the recruiter auth router, and ensures DB tables exist at startup.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.database import init_db
from app.routers import recruiter
from app.routers import pools
from app.candidate.router import router as candidate_router
from app.routers import users
from app.routers import job_offers
from app.routers import applications 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="xQuesty Link API", version="0.1.0")
app.include_router(pools.router)
app.include_router(candidate_router)

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

app.include_router(users.router)
app.include_router(job_offers.router)
app.include_router(applications.router)

@app.on_event("startup")
def on_startup():
    # Create the `recruiters` table if it does not exist yet.
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
