"""
routers/incidents.py
────────────────────
POST /api/incidents/report   — Full pipeline: upload → AI → DB → blockchain → notify
GET  /api/incidents/         — List incidents with optional filters
GET  /api/incidents/{id}     — Single incident
POST /api/incidents/{id}/confirm — Crowd verification
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from models.schemas import IncidentReportResponse
from services import blob, cosmos, gpt, hedera, notify, vision
from services.routing_engine import find_nearest_resource
from utils.severity import severity_risk_level, should_notify_authorities

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/incidents/report
# ---------------------------------------------------------------------------

@router.post("/report", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED)
async def report_incident(
    type:                       str          = Form(...),
    description:                str          = Form(...),
    location_text:              str          = Form(...),
    gps_lat:                    Optional[float] = Form(None),
    gps_lon:                    Optional[float] = Form(None),
    reporter_estimated_severity: int         = Form(5, ge=1, le=10),
    voice_transcript:           str          = Form(""),
    photo:                      Optional[UploadFile] = File(None),
    voice_file:                 Optional[UploadFile] = File(None),
    video:                      Optional[UploadFile] = File(None),
):
    """
    End-to-end incident reporting pipeline:

    1. Upload media → Azure Blob Storage
    2. Run vision AI (YOLOv11 + CLIP + SAM) if photo/video provided
    3. GPT-4o analysis → severity score + recommendation
    4. Store incident in Cosmos DB
    5. Index in Azure AI Search
    6. Hash → Hedera HCS
    7. Route to nearest resource
    8. Notify authorities if severity >= 7
    """
    incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    city, area  = _parse_location(location_text)

    # ── 1. Upload media ────────────────────────────────────────────────────
    photo_url = voice_url = video_url = None

    photo_bytes: bytes | None = None
    if photo:
        photo_bytes = await photo.read()
        photo_url   = blob.upload_media(photo_bytes, photo.filename, photo.content_type, incident_id)

    if voice_file:
        voice_bytes = await voice_file.read()
        voice_url   = blob.upload_media(voice_bytes, voice_file.filename, voice_file.content_type, incident_id)

    if video:
        video_bytes = await video.read()
        video_url   = blob.upload_media(video_bytes, video.filename, video.content_type, incident_id)

    # ── 2. Vision pipeline ─────────────────────────────────────────────────
    vision_result = {}
    if photo_url and photo_bytes is not None:
        # A media-analysis failure must not discard an already submitted
        # emergency report. The original photo remains available to responders.
        try:
            vision_result = vision.run_vision_pipeline(photo_bytes)
        except Exception as exc:
            print(f"[vision] analysis failed: {exc}")

    detected_objects = vision_result.get("detected_objects", [])
    clip_scene       = vision_result.get("clip_scene", "")
    sam_summary      = f"{vision_result.get('sam_segment_count', 0)} segments detected"

    # ── 3. GPT-4o analysis ─────────────────────────────────────────────────
    past = [
        f"{i['type']} sev {i['severity']}"
        for i in cosmos.list_incidents(city=city, severity_min=1)[:5]
    ]

    ai_raw = gpt.analyse_emergency(
        detected_objects  = detected_objects,
        clip_scene        = clip_scene,
        sam_summary       = sam_summary,
        voice_transcript  = voice_transcript,
        location          = location_text,
        past_incidents    = past,
    )

    try:
        severity = int(ai_raw.get("severity", reporter_estimated_severity))
    except (TypeError, ValueError):
        severity = reporter_estimated_severity
    severity = max(1, min(10, severity))
    risk_level = severity_risk_level(severity)

    ai_analysis = {
        "severity":              severity,
        "incident_type":         ai_raw.get("incident_type", type),
        "risk_level":            risk_level,
        "recommendation":        ai_raw.get("recommendation", ""),
        "detected_objects":      detected_objects,
        "clip_scene_description": clip_scene,
        "sam_segments":          [sam_summary],
    }

    # ── 4. Cosmos DB ───────────────────────────────────────────────────────
    # Zero is a valid coordinate, so test explicitly for missing values.
    gps = {"lat": gps_lat, "lon": gps_lon} if gps_lat is not None and gps_lon is not None else None

    incident_doc = {
        "id":           incident_id,
        "type":         type,
        "severity":     severity,
        "risk_level":   risk_level,
        "city":         city,
        "area":         area,
        "description":  description,
        "gps":          gps,
        "photo_url":    photo_url,
        "voice_url":    voice_url,
        "video_url":    video_url,
        "ai_analysis":  ai_analysis,
        "hedera_hash":  "",
        "verified":     False,
        "confirmed_by": [],
        "status":       "Critical" if severity >= 9 else "Active" if severity >= 5 else "Pending",
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "responders":   [],
    }
    cosmos.create_incident(incident_doc)

    # ── 5. Azure AI Search index ───────────────────────────────────────────
    try:
        from services.search import index_incident
        index_incident(incident_doc)
    except Exception as exc:
        print(f"[search] indexing failed: {exc}")

    # ── 6. Hedera HCS ──────────────────────────────────────────────────────
    try:
        hcs = hedera.log_to_hedera(incident_doc)
        cosmos.update_incident(incident_id, {
            "hedera_hash": hcs["hash"],
            "hedera_sequence_number": hcs["sequence_number"],
        })
        inc_hash = hcs["hash"]
    except Exception as exc:
        print(f"[hedera] logging failed: {exc}")
        inc_hash = hedera.hash_incident(incident_doc)   # store local hash

    # ── 7. Nearest resource routing ────────────────────────────────────────
    resource_type_map = {
        "Fire":              "fire_station",
        "Medical emergency": "hospital",
        "Accident":          "hospital",
    }
    r_type = resource_type_map.get(type, "police")
    route  = None
    if gps:
        try:
            route = find_nearest_resource(gps["lat"], gps["lon"], r_type)
        except Exception as exc:
            print(f"[routing] failed: {exc}")

    # ── 8. Notify authorities ──────────────────────────────────────────────
    notified: list[str] = []
    if should_notify_authorities(severity):
        updated_doc = cosmos.get_incident(incident_id) or incident_doc
        updated_doc["hedera_hash"] = inc_hash
        notified = notify.send_alert(updated_doc)

    return IncidentReportResponse(
        incident_id               = incident_id,
        severity                  = severity,
        risk_level                = risk_level,
        recommendation            = ai_analysis["recommendation"],
        hedera_hash               = inc_hash,
        route_to_nearest_resource = route,
        notifications_sent        = notified,
    )


# ---------------------------------------------------------------------------
# GET /api/incidents/
# ---------------------------------------------------------------------------

@router.get("/")
async def list_incidents(
    city:         Optional[str] = None,
    severity_min: int           = 1,
    status:       Optional[str] = None,
    limit:        int           = 50,
):
    return cosmos.list_incidents(city=city, severity_min=severity_min, status=status, limit=limit)


# ---------------------------------------------------------------------------
# GET /api/incidents/{id}
# ---------------------------------------------------------------------------

@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    doc = cosmos.get_incident(incident_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return doc


# ---------------------------------------------------------------------------
# POST /api/incidents/{id}/confirm — crowd verification
# ---------------------------------------------------------------------------

@router.post("/{incident_id}/confirm")
async def confirm_incident(incident_id: str, user_id: str = Form(...)):
    try:
        updated = cosmos.add_crowd_confirmation(incident_id, user_id)
        return {"verified": updated["verified"], "confirmations": len(updated["confirmed_by"])}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_location(location_text: str):
    """Split 'Area, City' into (city, area). Falls back gracefully."""
    parts = [p.strip() for p in location_text.split(",")]
    if len(parts) >= 2:
        return parts[-1], ", ".join(parts[:-1])
    return location_text, location_text
