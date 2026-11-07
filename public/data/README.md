# Static geospatial data

All files are GeoJSON FeatureCollections in EPSG:4326, coordinates `[lng, lat]`.

| File | Contents |
|---|---|
| `mysuru-boundary.geojson` | Mysuru district outline (1 feature) |
| `mysuru-taluks.geojson` | 8 taluks: H.D. Kote, Hunsur, K.R. Nagar, Mysuru, Nanjangud, Periyapatna, Saraguru, T. Narasipura |

**Source:** geoBoundaries gbOpen, India ADM2 / ADM3 (build Dec 2023), originally from the
Local Government Directory (lgdirectory.gov.in) via Pathways Data Pvt. Ltd.
**Licence:** Open Data Commons Open Database License (ODbL) 1.0 — attribution required (shown on maps and in the footer).

Processing: Mysuru features extracted, simplified (Douglas–Peucker, ~40 m tolerance), coordinates rounded to 5 decimals.
Saligrama taluk (created after the source data) is not separate in this dataset.

Each feature has `name`, `source` and `approximate` (boolean). If `approximate` is `true`,
the UI shows an "Approximate extent" warning.
