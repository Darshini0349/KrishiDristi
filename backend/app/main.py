"""KrishiDrishti API — run with:  uvicorn app.main:app --reload --port 8000"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import classification, regions, satellite
from app.services.model import load_model

app = FastAPI(
    title="KrishiDrishti API",
    version="0.1.0",
    description="Satellite-based crop type classification for Mysuru district using Sentinel-2 L2A imagery.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(regions.router)
app.include_router(satellite.router)
app.include_router(classification.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, object]:
    return {"status": "ok", "model_loaded": load_model() is not None, "imagery_source": "Microsoft Planetary Computer (Sentinel-2 L2A)"}
