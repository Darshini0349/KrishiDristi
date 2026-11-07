"""SQLite store for classification results produced by the model."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from typing import Iterator

from app.config import settings
from app.schemas import ClassificationRecord

SCHEMA = """
CREATE TABLE IF NOT EXISTS classifications (
  prediction_id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL,
  status TEXT NOT NULL,
  crop_type TEXT,
  confidence REAL,
  model_version TEXT,
  observation_date TEXT,
  field_area_ha REAL,
  created_at TEXT NOT NULL,
  record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cls_region ON classifications(region_id, created_at);
"""


@contextmanager
def _conn() -> Iterator[sqlite3.Connection]:
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    try:
        conn.executescript(SCHEMA)
        yield conn
        conn.commit()
    finally:
        conn.close()


def save(record: ClassificationRecord) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO classifications VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                record.prediction_id, record.region_id, record.status, record.crop_type, record.confidence,
                record.model_version, record.observation_date, record.field_area_ha, record.created_at,
                record.model_dump_json(),
            ),
        )


def query(
    region_id: str | None = None,
    crop_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 500,
) -> list[ClassificationRecord]:
    sql = "SELECT record_json FROM classifications WHERE 1=1"
    args: list[object] = []
    if region_id and region_id != "mysuru":  # district view includes all taluks
        sql += " AND region_id = ?"
        args.append(region_id)
    if crop_type:
        sql += " AND crop_type = ?"
        args.append(crop_type)
    if date_from:
        sql += " AND substr(created_at,1,10) >= ?"
        args.append(date_from)
    if date_to:
        sql += " AND substr(created_at,1,10) <= ?"
        args.append(date_to)
    sql += " ORDER BY created_at DESC LIMIT ?"
    args.append(limit)
    with _conn() as c:
        return [ClassificationRecord(**json.loads(r[0])) for r in c.execute(sql, args).fetchall()]
