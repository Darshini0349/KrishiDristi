"""Runtime settings, read from environment variables with sensible defaults."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent


def _list(name: str, default: str) -> list[str]:
    return [v.strip() for v in os.environ.get(name, default).split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    # Boundary GeoJSON files are shared with the frontend (single source of truth).
    boundary_dir: Path = Path(os.environ.get("KD_BOUNDARY_DIR", REPO_DIR / "public" / "data"))
    db_path: Path = Path(os.environ.get("KD_DB_PATH", BACKEND_DIR / "data" / "krishidrishti.db"))
    model_path: Path = Path(os.environ.get("KD_MODEL_PATH", BACKEND_DIR / "models" / "crop_model.joblib"))
    cors_origins: list[str] = field(
        default_factory=lambda: _list("KD_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    )
    # Microsoft Planetary Computer hosts the official Copernicus Sentinel-2 L2A archive.
    stac_url: str = os.environ.get("KD_STAC_URL", "https://planetarycomputer.microsoft.com/api/stac/v1")
    data_api_url: str = os.environ.get("KD_DATA_API_URL", "https://planetarycomputer.microsoft.com/api/data/v1")
    collection: str = "sentinel-2-l2a"
    http_timeout_s: float = float(os.environ.get("KD_HTTP_TIMEOUT_S", "45"))
    default_lookback_days: int = 120
    default_max_cloud_pct: float = 40.0
    cache_ttl_s: int = 600


settings = Settings()
