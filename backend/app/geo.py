"""Small, dependency-free geometry helpers. Coordinates are GeoJSON [lng, lat]."""
from __future__ import annotations

import math
from typing import Any, Iterable

EARTH_RADIUS_M = 6378137.0


def _rings(geom: dict[str, Any]) -> Iterable[list[list[list[float]]]]:
    if geom["type"] == "Polygon":
        yield geom["coordinates"]
    elif geom["type"] == "MultiPolygon":
        yield from geom["coordinates"]
    else:
        raise ValueError(f"Unsupported geometry type: {geom['type']}")


def ring_area_m2(ring: list[list[float]]) -> float:
    if len(ring) < 3:
        return 0.0
    total = 0.0
    for i in range(len(ring)):
        lng1, lat1 = ring[i][:2]
        lng2, lat2 = ring[(i + 1) % len(ring)][:2]
        total += math.radians(lng2 - lng1) * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2)))
    return abs(total * EARTH_RADIUS_M**2 / 2)


def area_m2(geom: dict[str, Any]) -> float:
    return sum(max(0.0, ring_area_m2(p[0]) - sum(ring_area_m2(h) for h in p[1:])) for p in _rings(geom))


def bbox(geom: dict[str, Any]) -> list[float]:
    xs, ys = [], []
    for poly in _rings(geom):
        for x, y, *_ in poly[0]:
            xs.append(x)
            ys.append(y)
    return [min(xs), min(ys), max(xs), max(ys)]


def bbox_polygon(b: list[float]) -> dict[str, Any]:
    x0, y0, x1, y1 = b
    return {"type": "Polygon", "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]}


def centroid(ring: list[list[float]]) -> tuple[float, float]:
    pts = ring[:-1] if len(ring) > 1 and ring[0] == ring[-1] else ring
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def _point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][:2]
        xj, yj = ring[j][:2]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def point_in_geometry(x: float, y: float, geom: dict[str, Any]) -> bool:
    return any(_point_in_ring(x, y, p[0]) and not any(_point_in_ring(x, y, h) for h in p[1:]) for p in _rings(geom))


def validate_polygon(coords: list[list[list[float]]]) -> str | None:
    """Return an error message if the polygon is not usable, else None."""
    if not coords or len(coords[0]) < 4:
        return "Polygon needs at least 3 distinct vertices (4 positions incl. closing point)."
    ring = coords[0]
    if ring[0][:2] != ring[-1][:2]:
        return "Polygon ring must be closed (first and last positions equal)."
    for x, y, *_ in ring:
        if not (-180 <= x <= 180 and -90 <= y <= 90):
            return "Coordinates must be WGS84 [longitude, latitude]."
    return None
