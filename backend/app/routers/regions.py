from fastapi import APIRouter, HTTPException

from app.schemas import Region
from app.services import regions

router = APIRouter(prefix="/api/regions", tags=["regions"])


@router.get("", response_model=list[Region])
def list_regions() -> list[Region]:
    """Mysuru district and its taluks (boundaries omitted; use the detail endpoint)."""
    return regions.list_regions()


@router.get("/{region_id}", response_model=Region)
def get_region(region_id: str) -> Region:
    found = regions.get_region(region_id)
    if not found:
        raise HTTPException(404, f"Unknown region '{region_id}'")
    region, geom = found
    return region.model_copy(update={"boundary": {"type": "Feature", "properties": {"name": region.name}, "geometry": geom}})
