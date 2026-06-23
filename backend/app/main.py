import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.database import init_db
from app.routers import pools
from app.routers import recruiter_supabase
from app.candidate import router as candidate_router
from app.interview import router as interview_router
from app.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="xQuesty Link API", version="0.1.0")

# Register routers
app.include_router(pools.router)          # Legacy /api/v1/pools
app.include_router(pools.job_pools_router) # New /api/v1/job-pools
app.include_router(candidate_router.router) # Candidate API
app.include_router(interview_router.router) # Interview API
app.include_router(recruiter_supabase.router) # New recruiter supabase auth
app.include_router(admin_router.router) # Admin API

# Allow the Next.js frontend to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.on_event("startup")
def on_startup():
    # Create the `recruiters` table if it does not exist yet.
    try:
        init_db()
    except Exception as e:
        logger.warning("Database initialization skipped during startup: %s", e)


@app.get("/health")
async def health():
    return {"status": "ok"}
