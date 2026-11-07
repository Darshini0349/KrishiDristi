import dataclasses

import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app
from app.services import sentinel, store


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # Isolated database per test
    monkeypatch.setattr(store, "settings", dataclasses.replace(config.settings, db_path=tmp_path / "test.db"))
    # Never hit the network in tests
    def offline(*_a, **_k):
        raise sentinel.SentinelError("offline in tests")
    monkeypatch.setattr(sentinel, "search_items", offline)
    monkeypatch.setattr(sentinel, "register_mosaic", offline)
    sentinel._cache.clear()
    return TestClient(app)
