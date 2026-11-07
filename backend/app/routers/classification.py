import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.geo import area_m2, centroid, point_in_geometry, validate_polygon
from app.schemas import (
    ClassificationRecord,
    ClassificationSummary,
    CropDistributionEntry,
    CropType,
    PredictRequest,
    PredictResponse,
)
from app.services import model as model_service
from app.services import regions, sentinel, store

router = APIRouter(prefix="/api/classification", tags=["classification"])

MAX_FIELD_HA = 10_000
MAX_FIELD_CLOUD_PCT = 30.0


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    """Classify one field. Measures the field on the chosen Sentinel-2 date; the crop
    prediction itself is only returned once a trained model is installed."""
    found = regions.get_region(req.region_id)
    if not found:
        raise HTTPException(404, f"Unknown region '{req.region_id}'")
    if err := validate_polygon(req.field.geometry.coordinates):
        raise HTTPException(422, err)
    obs_day = date.fromisoformat(req.observation_date)
    if obs_day > date.today() or obs_day < date(2015, 6, 23):
        raise HTTPException(422, "observation_date must be between 2015-06-23 (Sentinel-2A launch) and today")

    geom = req.field.geometry.model_dump()
    cx, cy = centroid(geom["coordinates"][0])
    if not point_in_geometry(cx, cy, regions.district_geometry()):
        raise HTTPException(422, "The field is outside Mysuru district, the current model scope.")
    area_ha = round(area_m2(geom) / 10_000, 3)
    if area_ha <= 0 or area_ha > MAX_FIELD_HA:
        raise HTTPException(422, f"Field area must be between 0 and {MAX_FIELD_HA} ha (got {area_ha} ha)")

    base = dict(
        prediction_id=str(uuid.uuid4()),
        observation_date=req.observation_date,
        field_area_ha=area_ha,
        created_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    try:
        observation = sentinel.field_observation(req.field.model_dump(), req.observation_date)
    except sentinel.SentinelError as e:
        raise HTTPException(502, str(e)) from e

    if observation is None:
        return PredictResponse(**base, status="no_data", message=f"No Sentinel-2 acquisition covers this field on {req.observation_date}. Choose a date from the availability list.")
    if observation.field_cloud_pct is not None and observation.field_cloud_pct > MAX_FIELD_CLOUD_PCT:
        return PredictResponse(
            **base, status="no_data", observation=observation,
            message=f"{observation.field_cloud_pct:.0f}% of the field is covered by cloud or cloud shadow on {req.observation_date}. Choose a clearer date.",
        )

    crop_model = model_service.load_model()
    if crop_model is None:
        return PredictResponse(
            **base, status="model_unavailable", observation=observation,
            message="Sentinel-2 data for this field was found and measured, but no crop classification model has been trained yet. "
            "A crop type will be predicted once the model is trained on verified field labels.",
        )

    crop, confidence, probs = crop_model.predict({"observation": observation.model_dump(), "area_ha": area_ha})
    response = PredictResponse(
        **base, status="completed", crop_type=crop, confidence=confidence, class_probabilities=probs,
        model_version=crop_model.version, observation=observation,
    )
    store.save(ClassificationRecord(**response.model_dump(), region_id=req.region_id, geometry=geom))
    return response


@router.get("/history", response_model=list[ClassificationRecord])
def history(
    region_id: str | None = None,
    crop_type: CropType | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(200, ge=1, le=2000),
) -> list[ClassificationRecord]:
    """Stored model predictions (only real model outputs are stored)."""
    return store.query(
        region_id, crop_type,
        date_from.isoformat() if date_from else None,
        date_to.isoformat() if date_to else None,
        limit,
    )


@router.get("/summary", response_model=ClassificationSummary)
def summary(region_id: str = "mysuru") -> ClassificationSummary:
    found = regions.get_region(region_id)
    if not found:
        raise HTTPException(404, f"Unknown region '{region_id}'")
    records = [r for r in store.query(region_id, limit=100_000) if r.status == "completed" and r.crop_type]
    counts: dict[str, int] = defaultdict(int)
    areas: dict[str, float] = defaultdict(float)
    for r in records:
        counts[r.crop_type] += 1
        areas[r.crop_type] += r.field_area_ha or 0.0
    latest = None
    try:
        today = date.today()
        obs = sentinel.observations_for_region(
            found[1], (today - timedelta(days=settings.default_lookback_days)).isoformat(), today.isoformat(), settings.default_max_cloud_pct
        )
        latest = obs[0].date if obs else None
    except sentinel.SentinelError:
        latest = None
    m = model_service.load_model()
    return ClassificationSummary(
        region_id=region_id,
        total_area_ha=round(sum(areas.values()), 2) if records else None,
        classified_fields=len(records) if records else None,
        latest_observation_date=latest,
        model_version=m.version if m else None,
        distribution=[CropDistributionEntry(crop_type=c, field_count=n, area_ha=round(areas[c], 2)) for c, n in counts.items()],
        dataset=None,
    )
