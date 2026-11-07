"""Step 2 — Learn crop-growth patterns from Sentinel-2 NDVI only (unsupervised).

Groups every pixel by the *shape of its greenness over the year* (K-means on the
monthly NDVI curve). Sentinel-2 alone cannot name crops, so groups are
labelled A, B, C… with a plain description of when they are green. Use the
generated visit list to check a few fields per group on the ground; those
checked fields become the training labels for the supervised crop model.

Example:
    python train_clusters.py --region t-narasipura
"""
from __future__ import annotations

import argparse
import calendar
import csv
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import ListedColormap  # noqa: E402
from sklearn.cluster import KMeans  # noqa: E402
from sklearn.metrics import silhouette_score  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent / "output"
# Validated colour-blind-safe categorical palette (same method as the web app).
GROUP_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
NEVER_GREEN_COLOR, WATER_COLOR = "#c9c9c4", "#4a5a6a"
GREEN_THRESHOLD = 0.5  # NDVI above this = actively growing, dense vegetation
NEVER_GREEN_MAX = 0.3  # max NDVI below this all year = built-up, rock, bare or permanently fallow


def month_label(m: str) -> str:
    return calendar.month_abbr[int(m[5:7])]


def pixel_area_m2(lat_deg: float, zoom: int) -> float:
    res = 156543.03392 * math.cos(math.radians(lat_deg)) / 2**zoom
    return res * res


def fill_gaps(x: np.ndarray) -> np.ndarray:
    """Fill isolated NaNs along time with the mean of the nearest earlier and later values."""
    n = x.shape[1]
    fwd, bwd = x.copy(), x.copy()
    for t in range(1, n):
        fwd[:, t] = np.where(np.isnan(fwd[:, t]), fwd[:, t - 1], fwd[:, t])
    for t in range(n - 2, -1, -1):
        bwd[:, t] = np.where(np.isnan(bwd[:, t]), bwd[:, t + 1], bwd[:, t])
    filled = np.where(np.isnan(x), np.nanmean(np.stack([fwd, bwd]), axis=0), x)
    return filled


def describe(curve: np.ndarray, months: list[str]) -> str:
    """Plain-language summary of a greenness curve: steady vs. seasonal, and how many green seasons."""
    lo, hi = float(curve.min()), float(curve.max())
    peak, low = int(np.argmax(curve)), int(np.argmin(curve))
    if hi - lo < 0.12:
        return f"steady all year (NDVI {lo:.2f}–{hi:.2f}); no clear sowing or harvest"
    cut = lo + 0.6 * (hi - lo)
    green = curve >= cut
    seasons, run = [], []
    for m, g in zip(months, green):
        if g:
            run.append(month_label(m))
        elif run:
            seasons.append(run)
            run = []
    if run:
        seasons.append(run)
    spans = [s[0] if len(s) == 1 else f"{s[0]}–{s[-1]}" for s in seasons]
    count = {1: "one green season", 2: "two green seasons", 3: "three green periods"}.get(len(seasons), f"{len(seasons)} green periods")
    return (f"{count} ({', '.join(spans)}); peak {month_label(months[peak])} (NDVI {hi:.2f}), "
            f"lowest {month_label(months[low])} ({lo:.2f})")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--region", default="t-narasipura", help="folder name under output/")
    ap.add_argument("--k-min", type=int, default=4)
    ap.add_argument("--k-max", type=int, default=8)
    ap.add_argument("--k", type=int, default=None, help="force a number of groups instead of choosing by silhouette")
    ap.add_argument("--min-month-coverage", type=float, default=0.5, help="drop months clear in less than this share of pixels")
    ap.add_argument("--visit-points", type=int, default=12, help="points per group to check on the ground")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    out = OUT_DIR / args.region
    d = np.load(out / "stack.npz")
    meta = json.loads((out / "stack_meta.json").read_text())
    ndvi, inside = d["ndvi"].astype(np.float32), d["inside"]
    months_all = [str(m) for m in d["months"]]
    west, south, east, north = (float(v) for v in d["bounds"])
    zoom = int(d["zoom"])
    H, W = inside.shape

    coverage = np.isfinite(ndvi[:, inside]).mean(1)
    keep = coverage >= args.min_month_coverage
    months = [m for m, k in zip(months_all, keep) if k]
    dropped = [f"{m} ({c:.0%} clear)" for m, c, k in zip(months_all, coverage, keep) if not k]
    print(f"Months used: {', '.join(months)}" + (f"; dropped: {', '.join(dropped)}" if dropped else ""))

    X_all = ndvi[keep][:, inside].T  # (pixels, months)
    enough = np.isfinite(X_all).sum(1) >= len(months) - 2
    X = fill_gaps(X_all[enough])
    X = np.clip(X, -1, 1)
    print(f"Pixels: {inside.sum():,} in region, {enough.sum():,} with ≥{len(months) - 2} clear months")

    water = np.median(X, axis=1) < 0.0
    never_green = ~water & (X.max(1) < NEVER_GREEN_MAX)
    veg = ~water & ~never_green
    Xv = X[veg]
    print(f"Rule-based: water {water.sum():,}, never green {never_green.sum():,}; clustering {veg.sum():,} vegetated pixels")

    rng = np.random.default_rng(args.seed)
    fit_idx = rng.choice(len(Xv), size=min(150_000, len(Xv)), replace=False)
    sil_idx = rng.choice(len(Xv), size=min(12_000, len(Xv)), replace=False)
    scores = {}
    models = {}
    for k in range(args.k_min, args.k_max + 1):
        km = KMeans(n_clusters=k, n_init=5, random_state=args.seed).fit(Xv[fit_idx])
        scores[k] = float(silhouette_score(Xv[sil_idx], km.predict(Xv[sil_idx])))
        models[k] = km
        print(f"  k={k}: silhouette {scores[k]:.3f}")
    best_k = args.k if args.k in models else max(scores, key=scores.get)
    km = models[best_k]
    print(f"Chosen number of groups: {best_k} ({'forced' if args.k else 'highest silhouette'})")

    # Order groups by month of peak greenness so letters read chronologically.
    centers = km.cluster_centers_
    order = np.lexsort((-centers.max(1), centers.argmax(1)))
    remap = np.empty(best_k, int)
    remap[order] = np.arange(best_k)
    labels_v = remap[km.predict(Xv)]
    centers = centers[order]

    # Full raster of group ids: -1 outside/no data, 0..k-1 groups, k never green, k+1 water
    grid = np.full(H * W, -1, np.int16)
    idx_inside = np.flatnonzero(inside.ravel())
    idx_enough = idx_inside[enough]
    lab = np.full(len(X), -1, np.int16)
    lab[veg] = labels_v
    lab[never_green] = best_k
    lab[water] = best_k + 1
    grid[idx_enough] = lab
    grid = grid.reshape(H, W)

    px_area = pixel_area_m2((south + north) / 2, zoom)
    letters = [chr(ord("A") + i) for i in range(best_k)]
    groups = []
    for i, letter in enumerate(letters):
        members = X[lab == i]
        groups.append({
            "id": letter, "kind": "crop-pattern group", "color": GROUP_COLORS[i],
            "pixels": int((lab == i).sum()), "area_ha": round((lab == i).sum() * px_area / 1e4),
            "mean_ndvi_curve": [round(float(v), 3) for v in centers[i]],
            "p25_curve": [round(float(v), 3) for v in np.percentile(members, 25, axis=0)],
            "p75_curve": [round(float(v), 3) for v in np.percentile(members, 75, axis=0)],
            "description": describe(centers[i], months),
        })
    for gid, name, color, mask in (("N", "Never green", NEVER_GREEN_COLOR, never_green), ("W", "Water", WATER_COLOR, water)):
        groups.append({
            "id": gid, "kind": "rule", "name": name, "color": color, "pixels": int(mask.sum()),
            "area_ha": round(mask.sum() * px_area / 1e4),
            "mean_ndvi_curve": [round(float(v), 3) for v in X[mask].mean(0)] if mask.any() else [],
            "description": "max NDVI below 0.3 all year (built-up, rock, bare or permanently fallow)" if gid == "N" else "median NDVI below 0 (water bodies, river)",
        })

    # Visit list: pixels whose 3x3 neighbourhood is all the same group (likely inside one field).
    pad = np.pad(grid, 1, constant_values=-1)
    same = np.ones_like(grid, bool)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            same &= pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W] == grid
    n = 2**zoom
    visit_rows = []
    for i, letter in enumerate(letters):
        rr, cc = np.nonzero(same & (grid == i))
        if len(rr) == 0:
            continue
        pick = rng.choice(len(rr), size=min(args.visit_points, len(rr)), replace=False)
        for j, p in enumerate(pick, 1):
            gx = (int(d["tile_x0"]) * 256 + cc[p] + 0.5) / (n * 256)
            gy = (int(d["tile_y0"]) * 256 + rr[p] + 0.5) / (n * 256)
            lon = gx * 360 - 180
            lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * gy))))
            visit_rows.append({
                "group": letter, "point": j, "latitude": round(lat, 6), "longitude": round(lon, 6),
                "google_maps": f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}", "crop_observed": "", "date_checked": "", "notes": "",
            })
    with open(out / "visit_points.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(visit_rows[0]))
        w.writeheader()
        w.writerows(visit_rows)

    # Figures
    colors = GROUP_COLORS[:best_k] + [NEVER_GREEN_COLOR, WATER_COLOR]
    cmap = ListedColormap(colors)
    fig, ax = plt.subplots(figsize=(9, 9), dpi=130)
    shown = np.ma.masked_less(grid, 0)
    ax.imshow(shown, cmap=cmap, vmin=-0.5, vmax=best_k + 1.5, interpolation="nearest", extent=(west, east, south, north))
    ax.set_title(f"{meta['region']} taluk — crop-pattern groups from Sentinel-2 NDVI\n{months[0]} to {months[-1]} · unsupervised (K-means, k={best_k})", fontsize=11)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_aspect(1 / math.cos(math.radians((south + north) / 2)))
    handles = [plt.Rectangle((0, 0), 1, 1, color=g["color"]) for g in groups]
    ax.legend(handles, [f"{g.get('name', 'Group ' + g['id'])} · {g['area_ha']:,} ha" for g in groups], loc="lower left", fontsize=8, frameon=True)
    fig.tight_layout()
    fig.savefig(out / "group_map.png")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=130)
    xs = np.arange(len(months))
    # End labels, nudged apart so they never overlap
    ends = sorted(((g["mean_ndvi_curve"][-1], g) for g in groups[:best_k]), key=lambda t: t[0])
    label_y, last = {}, -1.0
    for y, g in ends:
        last = max(y, last + 0.045)
        label_y[g["id"]] = last
    for g in groups[:best_k]:
        ax.fill_between(xs, g["p25_curve"], g["p75_curve"], color=g["color"], alpha=0.12, linewidth=0)
        ax.plot(xs, g["mean_ndvi_curve"], color=g["color"], linewidth=2, marker="o", markersize=4)
        ax.annotate(f"Group {g['id']}", (xs[-1], g["mean_ndvi_curve"][-1]), xytext=(xs[-1] + 0.15, label_y[g["id"]]),
                    textcoords="data", va="center", fontsize=9, color="#333")
    ax.axhline(GREEN_THRESHOLD, color="#999", linestyle=":", linewidth=1)
    ax.set_xticks(xs, [f"{month_label(m)}\n{m[:4]}" for m in months])
    ax.set_ylabel("NDVI (greenness)")
    ax.set_ylim(-0.1, 1.0)
    ax.set_xlim(-0.3, len(months) - 0.3 + 1)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", color="#e5e5e0")
    ax.set_title("Average greenness curve of each group (band = middle 50% of pixels)", fontsize=11)
    fig.tight_layout()
    fig.savefig(out / "group_curves.png")
    plt.close(fig)

    joblib.dump({"kmeans": km, "order": order, "months": months}, out / "pattern_model.joblib")
    result = {
        "model": "K-means on monthly median NDVI (unsupervised crop-pattern grouping)",
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "region": meta["region"], "source": meta["source"], "months": months, "months_dropped": dropped,
        "zoom": zoom, "pixel_size_m": round(math.sqrt(px_area), 1), "bounds": [west, south, east, north],
        "silhouette_by_k": scores, "k": best_k, "pixels_used": int(len(X)),
        "rules": {"water": "median NDVI < 0", "never_green": f"max NDVI < {NEVER_GREEN_MAX}"},
        "groups": groups,
        "note": "Groups are growth patterns, not crop names. Check visit_points.csv on the ground to name them.",
    }
    (out / "groups.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print("\nGroups:")
    for g in groups:
        print(f"  {g['id']}: {g['area_ha']:>7,} ha  {g['description']}")
    print(f"\nSaved to {out}: group_map.png, group_curves.png, groups.json, visit_points.csv, pattern_model.joblib")


if __name__ == "__main__":
    main()
