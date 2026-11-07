"""Sentinel-2 L2A access through Microsoft Planetary Computer.

Planetary Computer hosts the official Copernicus Sentinel-2 Level-2A archive.
We use three of its public APIs (no key required):
  * STAC search      — which scenes exist, when, with what cloud cover
  * mosaic tiles     — rendered XYZ map tiles (true colour, false colour, NDVI)
  * item statistics  — per-field band statistics (NDVI, scene classification)
"""
from __future__ import annotations

import time
from collections import defaultdict
from datetime import date
from typing import Any
from urllib.parse import quote

import httpx

from app.config import settings
from app.geo import bbox, bbox_polygon
from app.schemas import FieldObservation, SatelliteLayerSource, SatelliteObservation

NDVI_EXPR = "(B08-B04)/(B08+B04)"
# Sentinel-2 Scene Classification (SCL) classes treated as unusable for a field.
SCL_CLOUD_CLASSES = {3, 8, 9, 10}  # cloud shadow, cloud medium/high probability, thin cirrus
SCL_NODATA_CLASSES = {0, 1}  # no data, saturated/defective


class SentinelError(RuntimeError):
    """Raised when the upstream imagery service fails."""


_cache: dict[str, tuple[float, Any]] = {}


def _cached(key: str, ttl: int | None = None) -> Any | None:
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < (ttl or settings.cache_ttl_s):
        return hit[1]
    return None


def _store(key: str, value: Any) -> Any:
    _cache[key] = (time.time(), value)
    return value


def _client() -> httpx.Client:
    return httpx.Client(timeout=settings.http_timeout_s, headers={"User-Agent": "KrishiDrishti/0.1"})


def _post(client: httpx.Client, url: str, body: dict[str, Any], params: Any = None) -> dict[str, Any]:
    try:
        r = client.post(url, json=body, params=params)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as e:
        raise SentinelError(f"Imagery service request failed: {e}") from e


def search_items(
    geometry: dict[str, Any],
    date_from: str,
    date_to: str,
    max_cloud_pct: float | None = None,
    max_pages: int = 10,
) -> list[dict[str, Any]]:
    """STAC search for Sentinel-2 L2A scenes intersecting a geometry (metadata only)."""
    body: dict[str, Any] = {
        "collections": [settings.collection],
        "intersects": geometry,
        "datetime": f"{date_from}T00:00:00Z/{date_to}T23:59:59Z",
        "limit": 250,
        "fields": {
            "include": ["id", "properties.datetime", "properties.eo:cloud_cover", "properties.platform", "properties.s2:mgrs_tile"],
            "exclude": ["assets", "links", "geometry"],
        },
    }
    if max_cloud_pct is not None:
        body["query"] = {"eo:cloud_cover": {"lte": max_cloud_pct}}
    items: list[dict[str, Any]] = []
    with _client() as client:
        url = f"{settings.stac_url}/search"
        for _ in range(max_pages):
            page = _post(client, url, body)
            items.extend(page.get("features", []))
            nxt = next((link for link in page.get("links", []) if link.get("rel") == "next"), None)
            if not nxt:
                break
            url, body = nxt["href"], nxt.get("body", body)
    return items


def _platform_label(p: str | None) -> str:
    return (p or "Sentinel-2").replace("sentinel-2", "Sentinel-2").replace("Sentinel-2a", "Sentinel-2A").replace("Sentinel-2b", "Sentinel-2B").replace("Sentinel-2c", "Sentinel-2C")


def group_observations(items: list[dict[str, Any]], max_cloud_pct: float) -> list[SatelliteObservation]:
    """Group scenes by acquisition date. Cloud cover is the mean of the scene-level values."""
    by_date: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for it in items:
        by_date[it["properties"]["datetime"][:10]].append(it)
    out: list[SatelliteObservation] = []
    for d, scenes in by_date.items():
        clouds = [s["properties"].get("eo:cloud_cover") for s in scenes if s["properties"].get("eo:cloud_cover") is not None]
        mean_cloud = round(sum(clouds) / len(clouds), 1) if clouds else None
        if mean_cloud is not None and mean_cloud > max_cloud_pct:
            continue
        platforms = sorted({_platform_label(s["properties"].get("platform")) for s in scenes})
        tiles = sorted({s["properties"].get("s2:mgrs_tile") for s in scenes if s["properties"].get("s2:mgrs_tile")})
        out.append(
            SatelliteObservation(
                date=d,
                platform=", ".join(platforms),
                tile_id=tiles[0] if len(tiles) == 1 else f"{len(tiles)} tiles" if tiles else None,
                cloud_cover_pct=mean_cloud,
                product_id=scenes[0]["id"] if len(scenes) == 1 else None,
                scene_count=len(scenes),
            )
        )
    return sorted(out, key=lambda o: o.date, reverse=True)


def observations_for_region(geometry: dict[str, Any], date_from: str, date_to: str, max_cloud_pct: float) -> list[SatelliteObservation]:
    b = bbox(geometry)
    key = f"obs:{b}:{date_from}:{date_to}:{max_cloud_pct}"
    if (hit := _cached(key)) is not None:
        return hit
    # Query with the bbox (small request); scene-level cloud filter is applied per date afterwards.
    items = search_items(bbox_polygon(b), date_from, date_to)
    return _store(key, group_observations(items, max_cloud_pct))


def register_mosaic(geometry: dict[str, Any], day: str) -> str:
    """Register a mosaic of all scenes over the area on one day; returns the search id."""
    b = bbox(geometry)
    key = f"mosaic:{b}:{day}"
    if (hit := _cached(key, ttl=6 * 3600)) is not None:
        return hit
    body = {
        "collections": [settings.collection],
        "filter-lang": "cql2-json",
        "filter": {
            "op": "and",
            "args": [
                {"op": "s_intersects", "args": [{"property": "geometry"}, bbox_polygon(b)]},
                {"op": "anyinteracts", "args": [{"property": "datetime"}, {"interval": [f"{day}T00:00:00Z", f"{day}T23:59:59Z"]}]},
            ],
        },
        "sortby": [{"field": "eo:cloud_cover", "direction": "asc"}],
    }
    with _client() as client:
        res = _post(client, f"{settings.data_api_url}/mosaic/register", body)
    return _store(key, res["searchid"])


def layer_sources(search_id: str, day: str) -> list[SatelliteLayerSource]:
    base = f"{settings.data_api_url}/mosaic/{search_id}/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x?collection={settings.collection}&nodata=0&format=png"
    return [
        SatelliteLayerSource(
            id="sentinel2_true_color", label="Sentinel-2 true colour", date=day,
            tile_url=f"{base}&assets=visual&asset_bidx={quote('visual|1,2,3')}",
        ),
        SatelliteLayerSource(
            id="sentinel2_false_color", label="Sentinel-2 false colour", date=day,
            tile_url=f"{base}&assets=B08&assets=B04&assets=B03&rescale=0,5000",
        ),
        SatelliteLayerSource(
            id="ndvi", label="NDVI", date=day,
            tile_url=f"{base}&expression={quote(NDVI_EXPR)}&asset_as_band=true&rescale=-0.2,0.9&colormap_name=rdylgn",
        ),
    ]


def _stats(client: httpx.Client, item_id: str, feature: dict[str, Any], params: list[tuple[str, str]]) -> dict[str, Any]:
    res = _post(
        client,
        f"{settings.data_api_url}/item/statistics",
        feature,
        params=[("collection", settings.collection), ("item", item_id), ("max_size", "1024"), *params],
    )
    stats = res["properties"]["statistics"]
    return stats[next(iter(stats))]


def field_observation(field_feature: dict[str, Any], day: str) -> FieldObservation | None:
    """Measure a field on one acquisition day: cloud fraction (SCL) and NDVI. None if no scene."""
    items = search_items(field_feature["geometry"], day, day)
    if not items:
        return None
    best = min(items, key=lambda i: i["properties"].get("eo:cloud_cover", 100))
    with _client() as client:
        scl = _stats(client, best["id"], field_feature, [("assets", "SCL"), ("categorical", "true")])
        counts, classes = scl.get("histogram", [[], []])
        total = sum(c for c, k in zip(counts, classes) if int(k) not in SCL_NODATA_CLASSES)
        cloudy = sum(c for c, k in zip(counts, classes) if int(k) in SCL_CLOUD_CLASSES)
        ndvi = _stats(client, best["id"], field_feature, [("expression", NDVI_EXPR), ("asset_as_band", "true")])
    return FieldObservation(
        scene_id=best["id"],
        platform=_platform_label(best["properties"].get("platform")),
        scene_cloud_cover_pct=round(best["properties"].get("eo:cloud_cover", 0.0), 1),
        field_cloud_pct=round(100 * cloudy / total, 1) if total else None,
        ndvi_mean=round(ndvi["mean"], 3) if ndvi.get("mean") is not None else None,
        ndvi_std=round(ndvi["std"], 3) if ndvi.get("std") is not None else None,
        pixel_count=int(ndvi.get("count", 0)) or None,
    )


def today_iso() -> str:
    return date.today().isoformat()
