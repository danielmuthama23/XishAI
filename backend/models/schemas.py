"""
models/schemas.py — Pydantic request/response models
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------

class GPSCoordinate(BaseModel):
    lat: float
    lon: float


# ---------------------------------------------------------------------------
# Incidents
# ---------------------------------------------------------------------------

class IncidentReportRequest(BaseModel):
    """Payload sent by the React form when a citizen files a report."""
    type: str                              = Field(..., examples=["Fire"])
    description: str                       = Field(..., min_length=5)
    location_text: str                     = Field(..., examples=["Changamwe, Mombasa"])
    gps: Optional[GPSCoordinate]           = None
    reporter_estimated_severity: int       = Field(5, ge=1, le=10)
    # Media paths are resolved after upload to Azure Blob
    photo_url: Optional[str]               = None
    voice_url: Optional[str]               = None
    video_url: Optional[str]               = None
    # Crowd verification
    confirmed_by: List[str]                = Field(default_factory=list)


class AIAnalysisResult(BaseModel):
    severity: int
    incident_type: str
    risk_level: str                        # Info / Minor / Moderate / Serious / Critical
    recommendation: str
    detected_objects: List[str]            = Field(default_factory=list)
    clip_scene_description: str            = ""
    sam_segments: List[str]               = Field(default_factory=list)


class IncidentDocument(BaseModel):
    """Document stored in Cosmos DB."""
    id: str
    type: str
    severity: int
    risk_level: str
    city: str
    area: str
    gps: Optional[GPSCoordinate]
    photo_url: Optional[str]
    voice_url: Optional[str]
    video_url: Optional[str]
    ai_analysis: AIAnalysisResult
    hedera_hash: str
    hedera_sequence_number: Optional[int]
    verified: bool
    confirmed_by: List[str]
    status: str                            # Pending / Active / Resolved / Critical
    timestamp: datetime
    responders: List[str]                  = Field(default_factory=list)


class IncidentReportResponse(BaseModel):
    incident_id: str
    severity: int
    risk_level: str
    recommendation: str
    hedera_hash: str
    route_to_nearest_resource: Optional[dict] = None
    notifications_sent: List[str]          = Field(default_factory=list)


# ---------------------------------------------------------------------------
# AI / RAG
# ---------------------------------------------------------------------------

class RAGQueryRequest(BaseModel):
    question: str
    city_filter: Optional[str]             = None
    severity_min: Optional[int]            = None
    time_window_hours: Optional[int]       = 24


class RAGQueryResponse(BaseModel):
    answer: str
    source_incident_ids: List[str]
    confidence: float


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

class RouteRequest(BaseModel):
    incident_gps: GPSCoordinate
    resource_type: str                     # fire_station / hospital / police


class RouteResponse(BaseModel):
    resource_name: str
    resource_address: str
    distance_km: float
    estimated_time_minutes: int
    polyline: Optional[List[GPSCoordinate]]


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------

class CityRiskPrediction(BaseModel):
    city: str
    flood_probability: float
    fire_probability: float
    security_risk: float
    prediction_window_hours: int           = 24
    model_confidence: float
    generated_at: datetime
