# KrishiDrishti API (FastAPI)

Serves Mysuru boundaries, real Sentinel-2 L2A availability and imagery tiles, and field measurements.
Imagery comes from the official Copernicus Sentinel-2 archive hosted (free, no key) by
[Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a).

## Run

From the `backend/` folder:

**Windows**
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then start the website (`npm run dev` in the repo root). Interactive API docs: http://localhost:8000/docs

Tests: `python -m pytest -q` (offline; the imagery service is mocked).

## Endpoints

| Method | Path | What it returns |
|---|---|---|
| GET | `/api/health` | Status and whether a model is loaded |
| GET | `/api/regions` | Mysuru district + 8 taluks |
| GET | `/api/regions/{id}` | One region with its boundary |
| GET | `/api/satellite/availability` | Sentinel-2 dates over the region (default: last 120 days, ≤40 % cloud) and XYZ tile layers (true colour, false colour, NDVI) for `layer_date` or the latest date |
| POST | `/api/classification/predict` | Validates the field, finds the Sentinel-2 scene for the date, measures field cloud % (scene classification) and NDVI. Returns `model_unavailable` until a model is trained — it never invents a crop |
| GET | `/api/classification/history` | Stored model predictions (empty until a model exists) |
| GET | `/api/classification/summary` | Crop distribution from stored predictions |

## Layout

```
app/
  main.py            FastAPI app, CORS
  config.py          settings (env vars prefixed KD_)
  schemas.py         API models (match frontend src/types)
  geo.py             area, bbox, point-in-polygon
  routers/           regions, satellite, classification
  services/
    regions.py       loads ../public/data boundary GeoJSON
    sentinel.py      STAC search, mosaic tiles, field statistics
    store.py         SQLite store for predictions (backend/data/)
    model.py         hook for the trained crop model (none yet)
tests/               pytest suite
```

## Settings (optional environment variables)

| Variable | Default |
|---|---|
| `KD_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |
| `KD_DB_PATH` | `backend/data/krishidrishti.db` |
| `KD_MODEL_PATH` | `backend/models/crop_model.joblib` |
| `KD_BOUNDARY_DIR` | `public/data` |
