"""Regions from the static boundary files shared with the frontend."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any

from app.config import settings
from app.geo import area_m2, bbox
from app.schemas import Region

DISTRICT_ID = "mysuru"


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@lru_cache(maxsize=1)
def _load() -> dict[str, tuple[Region, dict[str, Any]]]:
    regions: dict[str, tuple[Region, dict[str, Any]]] = {}
    district = json.loads((settings.boundary_dir / "mysuru-boundary.geojson").read_text(encoding="utf-8"))
    for f in district["features"]:
        g = f["geometry"]
        regions[DISTRICT_ID] = (
            Region(id=DISTRICT_ID, name=f["properties"]["name"], level="district", bbox=bbox(g), area_km2=round(area_m2(g) / 1e6, 1)),
            g,
        )
    taluk_file = settings.boundary_dir / "mysuru-taluks.geojson"
    if taluk_file.exists():
        for f in json.loads(taluk_file.read_text(encoding="utf-8"))["features"]:
            g = f["geometry"]
            rid = f"{DISTRICT_ID}-{_slug(f['properties']['name'])}"
            regions[rid] = (
                Region(
                    id=rid,
                    name=f"{f['properties']['name']} Taluk",
                    level="taluk",
                    parent_id=DISTRICT_ID,
                    bbox=bbox(g),
                    area_km2=round(area_m2(g) / 1e6, 1),
                ),
                g,
            )
    return regions


def list_regions() -> list[Region]:
    return [r for r, _ in _load().values()]


def get_region(region_id: str) -> tuple[Region, dict[str, Any]] | None:
    return _load().get(region_id)


def district_geometry() -> dict[str, Any]:
    return _load()[DISTRICT_ID][1]
