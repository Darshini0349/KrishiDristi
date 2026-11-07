# KrishiDrishti

**Understanding agriculture through satellite intelligence.**
KrishiDrishti is a geospatial AI platform for **crop type classification** from **Sentinel-2** imagery and machine learning.
Version 1 covers **Mysuru district, Karnataka, India**.

This repository contains the web frontend (repo root) and the FastAPI backend (`backend/`).
The crop classification model is not trained yet; the backend says so instead of inventing predictions.

## Run it

1. **Backend** — see [backend/README.md](backend/README.md):
   `uvicorn app.main:app --reload --port 8000` inside `backend/`
2. **Website**, in a second terminal at the repo root:

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run lint
```

Copy `.env.example` to `.env.local` to point the app at a backend (default `http://localhost:8000`).
You can also change the URL at runtime under **Settings → API connection**.

## Data honesty

The UI never fabricates statistics, predictions or imagery.

- Every number comes from the API. When the backend is unreachable, panels say **"Backend not connected"**, **"Data not available"** or **"Awaiting satellite data"**.
- Model confidence is shown only when the model returns it.
- Sentinel-2, NDVI and classification layers stay disabled until the backend publishes real tile URLs.
- `public/data/mysuru-boundary.geojson` is currently an **approximate placeholder**, and the map labels it as such. Replace it with the official boundary (EPSG:4326, `properties.approximate: false`).

## Structure

```
src/
  config/        env (API URL), map extent & layers, crop categories
  types/         GeoJSON, region, satellite, classification types (snake_case = API contract)
  services/      Axios client, typed errors, one module per API area
  hooks/         useApi / useMutation, region data, boundary, field validation
  context/       backend status, workspace (region, field, observation date)
  components/
    layout/      Sidebar, Navbar, GlobalSearch, PublicNavbar, Footer, DashboardLayout
    ui/          DashboardCard, StatCard, StatusBadge, Loading/Empty/Error states, AsyncContent
    map/         InteractiveMap, FieldSelector (leaflet-draw), LayerControl, MapLegend, CoordinateDisplay
    charts/      CropDistributionChart
    classification/ RegionSelector, DateSelector, FieldSummary, ClassificationResult
  pages/         Landing, Overview, CropClassification, SatelliteExplorer, Reports, Settings
  utils/         geodesic area, point-in-polygon, CSV, formatting
```

GeoJSON coordinates are always `[lng, lat]`. Conversion to Leaflet's `[lat, lng]` happens only in `utils/geo.ts`.

## API (implemented in backend/)

| Method | Path | Used by |
|---|---|---|
| GET | `/api/health` | Backend health probe |
| GET | `/api/regions` | Region selector |
| GET | `/api/regions/{id}` | Region detail + boundary |
| GET | `/api/satellite/availability?region_id=` | Date selector, Explorer layers (`layers[].tile_url`) |
| POST | `/api/classification/predict` | Crop Classification: `{ region_id, observation_date, field: Feature<Polygon> }` |
| GET | `/api/classification/history` | Reports, recent activity (`date_from`, `date_to`, `crop_type`, `limit`) |
| GET | `/api/classification/summary?region_id=` | Overview KPIs and distribution |

Response shapes are defined in `src/types/`.

## Credits

Base map © OpenStreetMap contributors. Sentinel-2 imagery: Copernicus (once ingested). MIT licensed.
