import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.routers import pools
from app.routers import recruiter_supabase
from app.routers import matchier
from app.candidate import router as candidate_router
from app.interview import router as interview_router
from app.admin import router as admin_module

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="xQuesty Link API", version="0.1.0")

# Register routers
app.include_router(pools.router)          # Legacy /api/v1/pools
app.include_router(pools.job_pools_router) # New /api/v1/job-pools
app.include_router(matchier.router)        # Intelligent candidate matching API
app.include_router(candidate_router.router) # Candidate API
app.include_router(interview_router.router) # Interview API
app.include_router(recruiter_supabase.router) # New recruiter supabase auth
app.include_router(admin_module)  # Admin API (MVC module at /api/v1/admin)

# Allow the Vite (React) frontend to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health")
async def health():
    return {"status": "ok"}
