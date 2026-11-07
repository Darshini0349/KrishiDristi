"""Sentinel-2 L2A access via Microsoft Planetary Computer (official Copernicus data, no key needed)."""
from __future__ import annotations

import io
import time
from collections import defaultdict

import httpx
import numpy as np

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1"
DATA = "https://planetarycomputer.microsoft.com/api/data/v1"
COLLECTION = "sentinel-2-l2a"
# Scene Classification (SCL) classes kept as clear observations:
# 4 vegetation, 5 bare soil, 6 water, 7 unclassified. Clouds, shadows, saturated and no-data are dropped.
CLEAR_SCL = (4, 5, 6, 7)


def _bbox_polygon(b: list[float]) -> dict:
    x0, y0, x1, y1 = b
    return {"type": "Polygon", "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]}


def _request(client: httpx.Client, method: str, url: str, retries: int = 4, **kw) -> httpx.Response:
    for attempt in range(retries):
        try:
            r = client.request(method, url, **kw)
            if r.status_code in (429, 500, 502, 503, 504):
                raise httpx.HTTPStatusError("retryable", request=r.request, response=r)
            r.raise_for_status()
            return r
        except (httpx.TransportError, httpx.HTTPStatusError):
            if attempt == retries - 1:
                raise
            time.sleep(2**attempt)
    raise RuntimeError("unreachable")


def acquisition_dates(bbox: list[float], start: str, end: str, max_scene_cloud: float) -> dict[str, float]:
    """Dates with Sentinel-2 scenes over the bbox -> mean scene cloud cover (%)."""
    body = {
        "collections": [COLLECTION],
        "intersects": _bbox_polygon(bbox),
        "datetime": f"{start}T00:00:00Z/{end}T23:59:59Z",
        "query": {"eo:cloud_cover": {"lte": max_scene_cloud}},
        "limit": 500,
        "fields": {"include": ["id", "properties.datetime", "properties.eo:cloud_cover"], "exclude": ["assets", "links", "geometry"]},
    }
    by_date: dict[str, list[float]] = defaultdict(list)
    with httpx.Client(timeout=60) as c:
        url = f"{STAC}/search"
        while True:
            page = _request(c, "POST", url, json=body).json()
            for f in page["features"]:
                by_date[f["properties"]["datetime"][:10]].append(f["properties"]["eo:cloud_cover"])
            nxt = next((link for link in page.get("links", []) if link.get("rel") == "next"), None)
            if not nxt:
                break
            url, body = nxt["href"], nxt.get("body", body)
    return {d: sum(v) / len(v) for d, v in sorted(by_date.items())}


def register_mosaic(client: httpx.Client, bbox: list[float], day: str) -> str:
    body = {
        "collections": [COLLECTION],
        "filter-lang": "cql2-json",
        "filter": {"op": "and", "args": [
            {"op": "s_intersects", "args": [{"property": "geometry"}, _bbox_polygon(bbox)]},
            {"op": "anyinteracts", "args": [{"property": "datetime"}, {"interval": [f"{day}T00:00:00Z", f"{day}T23:59:59Z"]}]},
        ]},
        "sortby": [{"field": "eo:cloud_cover", "direction": "asc"}],
    }
    return _request(client, "POST", f"{DATA}/mosaic/register", json=body).json()["searchid"]


def ndvi_tile(client: httpx.Client, search_id: str, z: int, x: int, y: int) -> np.ndarray:
    """NDVI for one 256x256 tile; NaN where cloudy, shadowed or missing."""
    r = _request(
        client, "GET",
        f"{DATA}/mosaic/{search_id}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.npy",
        params=[("collection", COLLECTION), ("assets", "B04"), ("assets", "B08"), ("assets", "SCL"), ("resampling", "nearest")],
    )
    if r.status_code == 204 or not r.content:  # no scene covers this tile on this date
        return np.full((256, 256), np.nan, np.float32)
    arr = np.load(io.BytesIO(r.content))  # (4, 256, 256): B04, B08, SCL, mask
    red, nir, scl, mask = (arr[i].astype(np.float32) for i in range(4))
    with np.errstate(invalid="ignore", divide="ignore"):
        ndvi = (nir - red) / (nir + red)
    clear = np.isin(scl, CLEAR_SCL) & (mask > 0) & ((nir + red) > 0)
    return np.where(clear, ndvi, np.nan).astype(np.float32)
