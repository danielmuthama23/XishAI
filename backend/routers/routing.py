"""
routers/routing.py
──────────────────
GET /api/routing/nearest  — find nearest resource + road route
"""
from fastapi import APIRouter, HTTPException
from models.schemas import RouteResponse
from services.routing_engine import find_nearest_resource

router = APIRouter()


@router.get("/nearest", response_model=RouteResponse)
async def nearest_resource(
    lat:           float,
    lon:           float,
    resource_type: str = "fire_station",
):
    result = find_nearest_resource(lat, lon, resource_type)
    if not result:
        raise HTTPException(status_code=404, detail=f"No {resource_type} resources found")
    return result
