import logging

from fastapi import FastAPI

from app.routers import pools

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="xQuesty Link API", version="0.1.0")
app.include_router(pools.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
