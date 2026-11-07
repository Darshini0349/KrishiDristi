"""Crop classification model hook.

No model is trained yet. When one exists, save it to settings.model_path and
implement `load_model` so that it returns an object with:

    version: str
    predict(features: dict) -> tuple[crop_type, confidence, class_probabilities]

Until then `load_model()` returns None and the API reports `model_unavailable`
instead of inventing a prediction.
"""
from __future__ import annotations

from typing import Any, Protocol

from app.config import settings


class CropModel(Protocol):
    version: str

    def predict(self, features: dict[str, Any]) -> tuple[str, float, dict[str, float]]: ...


def load_model() -> CropModel | None:
    if not settings.model_path.exists():
        return None
    raise NotImplementedError(
        f"A model file exists at {settings.model_path}, but loading is not implemented yet. "
        "Implement app/services/model.py:load_model for your trained model."
    )
