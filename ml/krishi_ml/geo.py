"""Web-Mercator tile maths and region masks."""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from matplotlib.path import Path as MplPath

TILE = 256
REPO = Path(__file__).resolve().parents[2]
BOUNDARY_DIR = REPO / "public" / "data"


def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 2**z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def tile_range(bbox: list[float], z: int) -> tuple[range, range]:
    x0, y1 = lonlat_to_tile(bbox[0], bbox[1], z)  # SW corner -> max y
    x1, y0 = lonlat_to_tile(bbox[2], bbox[3], z)  # NE corner -> min y
    return range(x0, x1 + 1), range(y0, y1 + 1)


def pixel_centers(xs: range, ys: range, z: int) -> tuple[np.ndarray, np.ndarray]:
    """Lon/lat of every pixel centre in the tile grid (H, W)."""
    n = 2**z
    cols = (xs.start * TILE + np.arange(len(xs) * TILE) + 0.5) / (n * TILE)
    rows = (ys.start * TILE + np.arange(len(ys) * TILE) + 0.5) / (n * TILE)
    lon = cols * 360 - 180
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * rows))))
    return np.meshgrid(lon, lat)


def grid_bounds(xs: range, ys: range, z: int) -> list[float]:
    """[west, south, east, north] of the tile grid."""
    n = 2**z
    west = xs.start / n * 360 - 180
    east = (xs.stop) / n * 360 - 180
    north = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * ys.start / n))))
    south = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * ys.stop / n))))
    return [west, south, east, north]


def load_region(name: str) -> tuple[str, dict]:
    """Find a region by name in the boundary files: 'Mysuru District' or a taluk like 'T. Narasipura'."""
    key = name.lower().replace(" taluk", "").strip()
    for fname in ("mysuru-taluks.geojson", "mysuru-boundary.geojson"):
        for f in json.loads((BOUNDARY_DIR / fname).read_text(encoding="utf-8"))["features"]:
            n = f["properties"]["name"]
            if n.lower() == key or n.lower().replace(" district", "") == key:
                return n, f["geometry"]
    raise SystemExit(f"Region '{name}' not found. Use 'Mysuru' or a taluk name, e.g. 'T. Narasipura'.")


def geometry_bbox(geom: dict) -> list[float]:
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    pts = np.array([p[:2] for poly in polys for p in poly[0]])
    return [pts[:, 0].min(), pts[:, 1].min(), pts[:, 0].max(), pts[:, 1].max()]


def region_mask(geom: dict, lon: np.ndarray, lat: np.ndarray) -> np.ndarray:
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    pts = np.column_stack([lon.ravel(), lat.ravel()])
    inside = np.zeros(len(pts), bool)
    for poly in polys:
        inside |= MplPath(np.array(poly[0])[:, :2]).contains_points(pts)
        for hole in poly[1:]:
            inside &= ~MplPath(np.array(hole)[:, :2]).contains_points(pts)
    return inside.reshape(lon.shape)
