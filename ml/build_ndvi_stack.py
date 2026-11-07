"""Step 1 — Build a monthly NDVI time series from Sentinel-2 L2A for one region.

Example:
    python build_ndvi_stack.py --region "T. Narasipura" --start 2025-06-01 --end 2026-05-31

Output: output/<region>/stack.npz  (monthly median NDVI per pixel, cloud-masked)
"""
from __future__ import annotations

import argparse
import json
import re
import time
import warnings
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
import numpy as np

from krishi_ml import geo, sentinel

OUT_DIR = Path(__file__).resolve().parent / "output"


def pick_dates(dates: dict[str, float], per_month: int) -> dict[str, list[str]]:
    """Keep the clearest `per_month` acquisition dates in each calendar month."""
    by_month: dict[str, list[tuple[float, str]]] = defaultdict(list)
    for d, cloud in dates.items():
        by_month[d[:7]].append((cloud, d))
    return {m: sorted(d for _, d in sorted(v)[:per_month]) for m, v in sorted(by_month.items())}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--region", default="T. Narasipura", help="'Mysuru' or a taluk name")
    ap.add_argument("--start", default="2025-06-01")
    ap.add_argument("--end", default="2026-05-31")
    ap.add_argument("--zoom", type=int, default=12, help="12 ≈ 38 m pixels, 13 ≈ 19 m pixels (4x more downloads)")
    ap.add_argument("--per-month", type=int, default=4, help="clearest acquisition dates used per month")
    ap.add_argument("--max-scene-cloud", type=float, default=60)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    name, geom = geo.load_region(args.region)
    bbox = geo.geometry_bbox(geom)
    xs, ys = geo.tile_range(bbox, args.zoom)
    print(f"Region: {name}  bbox={[round(v, 3) for v in bbox]}  tiles={len(xs)}x{len(ys)} at zoom {args.zoom}")

    dates = sentinel.acquisition_dates(bbox, args.start, args.end, args.max_scene_cloud)
    months = pick_dates(dates, args.per_month)
    used = [d for v in months.values() for d in v]
    print(f"Sentinel-2 dates found: {len(dates)}; using {len(used)} across {len(months)} months")
    for m, ds in months.items():
        print(f"  {m}: {', '.join(ds)}")

    client = httpx.Client(timeout=90, limits=httpx.Limits(max_connections=args.workers * 2))
    with ThreadPoolExecutor(args.workers) as pool:
        search_ids = dict(zip(used, pool.map(lambda d: sentinel.register_mosaic(client, bbox, d), used)))

    month_keys = list(months)
    H, W = len(ys) * geo.TILE, len(xs) * geo.TILE
    stack = np.full((len(month_keys), H, W), np.nan, np.float32)
    clear_counts = np.zeros((len(month_keys), H, W), np.uint8)

    def process_tile(tile: tuple[int, int]) -> None:
        tx, ty = tile
        r0, c0 = (ty - ys.start) * geo.TILE, (tx - xs.start) * geo.TILE
        for mi, m in enumerate(month_keys):
            obs = [sentinel.ndvi_tile(client, search_ids[d], args.zoom, tx, ty) for d in months[m]]
            arr = np.stack(obs)
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", RuntimeWarning)  # all-cloudy pixels -> NaN
                stack[mi, r0:r0 + geo.TILE, c0:c0 + geo.TILE] = np.nanmedian(arr, axis=0)
            clear_counts[mi, r0:r0 + geo.TILE, c0:c0 + geo.TILE] = np.isfinite(arr).sum(0)

    tiles = [(x, y) for y in ys for x in xs]
    t0, done = time.time(), 0
    with ThreadPoolExecutor(args.workers) as pool:
        for _ in pool.map(process_tile, tiles):
            done += 1
            if done % max(1, len(tiles) // 10) == 0 or done == len(tiles):
                print(f"  tiles {done}/{len(tiles)}  ({time.time() - t0:.0f}s)")
    client.close()

    lon, lat = geo.pixel_centers(xs, ys, args.zoom)
    inside = geo.region_mask(geom, lon, lat)
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    out = OUT_DIR / slug
    out.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        out / "stack.npz",
        ndvi=stack.astype(np.float16), clear_counts=clear_counts, inside=inside,
        months=np.array(month_keys), bounds=np.array(geo.grid_bounds(xs, ys, args.zoom)),
        tile_x0=xs.start, tile_y0=ys.start, zoom=args.zoom,
    )
    meta = {
        "region": name, "zoom": args.zoom, "bbox": bbox, "start": args.start, "end": args.end,
        "dates_used": months, "dates_available": len(dates), "max_scene_cloud": args.max_scene_cloud,
        "source": "Copernicus Sentinel-2 L2A via Microsoft Planetary Computer", "clear_scl_classes": list(sentinel.CLEAR_SCL),
    }
    (out / "stack_meta.json").write_text(json.dumps(meta, indent=2))
    cover = np.isfinite(stack[:, inside]).mean(1)
    print("Clear-pixel coverage inside region per month:")
    for m, c in zip(month_keys, cover):
        print(f"  {m}: {c:.0%}")
    print(f"Saved {out / 'stack.npz'}")


if __name__ == "__main__":
    main()
