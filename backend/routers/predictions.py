"""
routers/predictions.py
──────────────────────
GET /api/predictions/{city}  — 24-hour risk forecast from Azure ML
"""
from __future__ import annotations

import os
import json
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from models.schemas import CityRiskPrediction

router = APIRouter()

# Azure ML Online Endpoint
AML_ENDPOINT = os.getenv("AML_SCORING_URI",  "https://YOUR_AML.inference.ml.azure.com/score")
AML_KEY      = os.getenv("AML_SCORING_KEY",  "")


@router.get("/{city}", response_model=CityRiskPrediction)
async def get_city_prediction(city: str, window_hours: int = 24):
    """
    Call Azure Machine Learning real-time scoring endpoint.
    Falls back to a rules-based estimate when AML is not configured.
    """
    if AML_KEY:
        prediction = await _call_aml(city, window_hours)
    else:
        prediction = _fallback_prediction(city)

    return CityRiskPrediction(
        city                   = city,
        flood_probability      = prediction["flood"],
        fire_probability       = prediction["fire"],
        security_risk          = prediction["security"],
        prediction_window_hours= window_hours,
        model_confidence       = prediction.get("confidence", 0.82),
        generated_at           = datetime.now(timezone.utc),
    )


async def _call_aml(city: str, window_hours: int) -> dict:
    payload = {"city": city, "window_hours": window_hours}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            AML_ENDPOINT,
            headers={"Authorization": f"Bearer {AML_KEY}", "Content-Type": "application/json"},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json()


def _fallback_prediction(city: str) -> dict:
    """
    Simple lookup table — replace with real model in production.
    Values are approximate based on historical Kenya incident patterns.
    """
    defaults = {
        "Kisumu":   {"flood": 0.82, "fire": 0.12, "security": 0.28, "confidence": 0.79},
        "Mombasa":  {"flood": 0.45, "fire": 0.67, "security": 0.74, "confidence": 0.84},
        "Nairobi":  {"flood": 0.61, "fire": 0.34, "security": 0.55, "confidence": 0.88},
        "Nakuru":   {"flood": 0.30, "fire": 0.22, "security": 0.38, "confidence": 0.76},
        "Eldoret":  {"flood": 0.18, "fire": 0.15, "security": 0.24, "confidence": 0.72},
    }
    return defaults.get(city, {"flood": 0.3, "fire": 0.2, "security": 0.3, "confidence": 0.5})
