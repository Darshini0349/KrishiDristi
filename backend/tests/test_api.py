from app.schemas import FieldObservation
from app.services import sentinel

# A small field just north-west of Mysuru city (inside the district).
FIELD = {
    "type": "Feature",
    "properties": {"source": "drawn"},
    "geometry": {"type": "Polygon", "coordinates": [[[76.55, 12.36], [76.553, 12.36], [76.553, 12.363], [76.55, 12.363], [76.55, 12.36]]]},
}


def predict(client, **overrides):
    body = {"region_id": "mysuru", "observation_date": "2025-10-29", "field": FIELD, **overrides}
    return client.post("/api/classification/predict", json=body)


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_regions_lists_district_and_taluks(client):
    regions = client.get("/api/regions").json()
    ids = {r["id"] for r in regions}
    assert "mysuru" in ids
    assert sum(r["level"] == "taluk" for r in regions) == 8
    assert all(r["boundary"] is None for r in regions)


def test_region_detail_has_boundary(client):
    r = client.get("/api/regions/mysuru").json()
    assert r["boundary"]["geometry"]["type"] in ("Polygon", "MultiPolygon")
    assert client.get("/api/regions/nowhere").status_code == 404


def test_availability_reports_upstream_failure(client):
    assert client.get("/api/satellite/availability?region_id=mysuru").status_code == 502


def test_group_observations_by_date_and_cloud():
    items = [
        {"id": "a", "properties": {"datetime": "2025-10-29T05:00:00Z", "eo:cloud_cover": 2.0, "platform": "Sentinel-2A", "s2:mgrs_tile": "43PFP"}},
        {"id": "b", "properties": {"datetime": "2025-10-29T05:00:00Z", "eo:cloud_cover": 8.0, "platform": "Sentinel-2B", "s2:mgrs_tile": "43PFQ"}},
        {"id": "c", "properties": {"datetime": "2025-10-27T05:00:00Z", "eo:cloud_cover": 90.0, "platform": "Sentinel-2C", "s2:mgrs_tile": "43PFP"}},
    ]
    obs = sentinel.group_observations(items, max_cloud_pct=40)
    assert [o.date for o in obs] == ["2025-10-29"]
    assert obs[0].cloud_cover_pct == 5.0
    assert obs[0].scene_count == 2
    assert obs[0].platform == "Sentinel-2A, Sentinel-2B"


def test_predict_rejects_field_outside_district(client):
    outside = {**FIELD, "geometry": {"type": "Polygon", "coordinates": [[[77.6, 12.97], [77.61, 12.97], [77.61, 12.98], [77.6, 12.97]]]}}
    r = predict(client, field=outside)
    assert r.status_code == 422
    assert "outside Mysuru" in r.json()["detail"]


def test_predict_rejects_open_ring_and_future_date(client):
    open_ring = {**FIELD, "geometry": {"type": "Polygon", "coordinates": [[[76.55, 12.36], [76.553, 12.36], [76.553, 12.363], [76.55, 12.363]]]}}
    assert predict(client, field=open_ring).status_code == 422
    assert predict(client, observation_date="2999-01-01").status_code == 422


def test_predict_no_scene_returns_no_data(client, monkeypatch):
    monkeypatch.setattr(sentinel, "field_observation", lambda *_: None)
    body = predict(client).json()
    assert body["status"] == "no_data"
    assert body["crop_type"] is None and body["confidence"] is None


def test_predict_cloudy_field_returns_no_data(client, monkeypatch):
    obs = FieldObservation(scene_id="S2", field_cloud_pct=80.0, ndvi_mean=0.1)
    monkeypatch.setattr(sentinel, "field_observation", lambda *_: obs)
    body = predict(client).json()
    assert body["status"] == "no_data"
    assert "cloud" in body["message"]


def test_predict_without_model_never_invents_a_crop(client, monkeypatch):
    obs = FieldObservation(scene_id="S2", field_cloud_pct=0.0, ndvi_mean=0.42, pixel_count=1000)
    monkeypatch.setattr(sentinel, "field_observation", lambda *_: obs)
    body = predict(client).json()
    assert body["status"] == "model_unavailable"
    assert body["crop_type"] is None
    assert body["confidence"] is None
    assert body["observation"]["ndvi_mean"] == 0.42
    assert 9 < body["field_area_ha"] < 12
    # Nothing is stored without a real model prediction
    assert client.get("/api/classification/history").json() == []


def test_summary_is_empty_without_predictions(client):
    s = client.get("/api/classification/summary?region_id=mysuru").json()
    assert s["distribution"] == []
    assert s["classified_fields"] is None and s["total_area_ha"] is None and s["model_version"] is None
