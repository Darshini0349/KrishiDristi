# Static geospatial data

| File | Contents | Status |
|---|---|---|
| `mysuru-boundary.geojson` | Mysuru district outline (FeatureCollection, EPSG:4326, `[lng, lat]`) | **Placeholder (approximate)** — awaiting official boundary |

Each feature must have properties `name`, `source` and `approximate` (boolean).
The UI shows an "Approximate extent" warning whenever `approximate` is `true`.
