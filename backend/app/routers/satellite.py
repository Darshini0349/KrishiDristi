from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas import SatelliteAvailability
from app.services import regions, sentinel

router = APIRouter(prefix="/api/satellite", tags=["satellite"])


@router.get("/availability", response_model=SatelliteAvailability)
def availability(
    region_id: str = Query("mysuru"),
    date_from: date | None = None,
    date_to: date | None = None,
    max_cloud_pct: float = Query(settings.default_max_cloud_pct, ge=0, le=100),
    layer_date: date | None = Query(None, description="Date for imagery map layers; defaults to the latest observation"),
) -> SatelliteAvailability:
    """Real Sentinel-2 L2A acquisitions over the region, plus map tile layers for one date."""
    found = regions.get_region(region_id)
    if not found:
        raise HTTPException(404, f"Unknown region '{region_id}'")
    _, geom = found
    d_to = date_to or date.today()
    d_from = date_from or d_to - timedelta(days=settings.default_lookback_days)
    if d_from > d_to:
        raise HTTPException(422, "date_from must be before date_to")
    try:
        obs = sentinel.observations_for_region(geom, d_from.isoformat(), d_to.isoformat(), max_cloud_pct)
        latest = obs[0].date if obs else None
        day = layer_date.isoformat() if layer_date else latest
        layers = sentinel.layer_sources(sentinel.register_mosaic(geom, day), day) if day else []
    except sentinel.SentinelError as e:
        raise HTTPException(502, str(e)) from e
    return SatelliteAvailability(
        region_id=region_id,
        date_from=d_from.isoformat(),
        date_to=d_to.isoformat(),
        max_cloud_pct=max_cloud_pct,
        observations=obs,
        latest_observation_date=latest,
        layer_date=day,
        layers=layers,
    )
