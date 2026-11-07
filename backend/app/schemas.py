"""API models. Field names match the frontend types in src/types/ (snake_case)."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

CropType = Literal["paddy", "ragi", "maize", "jowar", "sugarcane", "groundnut", "cotton", "other"]
ClassificationStatus = Literal["completed", "no_data", "failed", "pending", "model_unavailable"]


class Region(BaseModel):
    id: str
    name: str
    level: Literal["district", "taluk"]
    state: str = "Karnataka"
    parent_id: str | None = None
    bbox: list[float] | None = None
    area_km2: float | None = None
    boundary: dict[str, Any] | None = None


class SatelliteObservation(BaseModel):
    date: str
    platform: str
    processing_level: str = "L2A"
    tile_id: str | None = None
    cloud_cover_pct: float | None = None
    product_id: str | None = None
    scene_count: int = 1


class SatelliteLayerSource(BaseModel):
    id: Literal["sentinel2_true_color", "sentinel2_false_color", "ndvi", "classification"]
    label: str
    tile_url: str
    attribution: str = "Contains modified Copernicus Sentinel data, served by Microsoft Planetary Computer"
    date: str | None = None


class SatelliteAvailability(BaseModel):
    region_id: str
    date_from: str
    date_to: str
    max_cloud_pct: float
    observations: list[SatelliteObservation]
    latest_observation_date: str | None = None
    layer_date: str | None = None
    layers: list[SatelliteLayerSource] = []


class PolygonGeometry(BaseModel):
    type: Literal["Polygon"]
    coordinates: list[list[list[float]]]


class FieldFeature(BaseModel):
    type: Literal["Feature"]
    properties: dict[str, Any] | None = None
    geometry: PolygonGeometry


class PredictRequest(BaseModel):
    region_id: str
    observation_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    field: FieldFeature


class FieldObservation(BaseModel):
    """Real measurements of the field from the Sentinel-2 scene used."""

    scene_id: str
    platform: str | None = None
    scene_cloud_cover_pct: float | None = None
    field_cloud_pct: float | None = None
    ndvi_mean: float | None = None
    ndvi_std: float | None = None
    pixel_count: int | None = None


class PredictResponse(BaseModel):
    prediction_id: str
    status: ClassificationStatus
    crop_type: CropType | None = None
    confidence: float | None = None
    class_probabilities: dict[str, float] | None = None
    model_version: str | None = None
    observation_date: str | None = None
    field_area_ha: float | None = None
    message: str | None = None
    created_at: str | None = None
    observation: FieldObservation | None = None


class ClassificationRecord(PredictResponse):
    region_id: str
    geometry: dict[str, Any] | None = None


class CropDistributionEntry(BaseModel):
    crop_type: CropType
    field_count: int
    area_ha: float | None = None


class DatasetStatus(BaseModel):
    training_samples: int | None = None
    label_source: str | None = None
    label_season: str | None = None
    last_updated: str | None = None


class ClassificationSummary(BaseModel):
    region_id: str
    total_area_ha: float | None = None
    classified_fields: int | None = None
    latest_observation_date: str | None = None
    model_version: str | None = None
    distribution: list[CropDistributionEntry] = []
    dataset: DatasetStatus | None = None
