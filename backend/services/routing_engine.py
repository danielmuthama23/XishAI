"""
services/routing_engine.py
──────────────────────────
Find the nearest emergency resource and compute the shortest route.

Two-phase approach:
  Phase 1 — Filter resources by type from Cosmos DB
  Phase 2 — Use OSRM (Open Source Routing Machine) for real road distances.
             Fall back to Dijkstra over a simple in-memory graph when OSRM
             is unavailable (e.g. offline / dev mode).
"""
from __future__ import annotations

import math
import os
from typing import List, Optional, Tuple

import requests
import networkx as nx

from services.cosmos import get_resources_by_type

OSRM_SERVER = os.getenv("OSRM_SERVER", "http://router.project-osrm.org")


# ---------------------------------------------------------------------------
# Haversine distance (km) between two (lat, lon) points
# ---------------------------------------------------------------------------

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# OSRM route lookup
# ---------------------------------------------------------------------------

def _osrm_route(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float,
) -> Optional[dict]:
    """
    Call OSRM /route/v1/driving endpoint.
    Returns dict with distance_km, duration_s, geometry or None on failure.
    """
    url = (
        f"{OSRM_SERVER}/route/v1/driving/"
        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        "?overview=full&geometries=geojson"
    )
    try:
        resp = requests.get(url, timeout=5)
        data = resp.json()
        if data.get("code") != "Ok":
            return None
        route = data["routes"][0]
        coords = route["geometry"]["coordinates"]  # [[lon,lat], ...]
        return {
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_s":  round(route["duration"]),
            "polyline": [{"lat": c[1], "lon": c[0]} for c in coords],
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Dijkstra fallback over a tiny synthetic graph (dev / offline mode)
# ---------------------------------------------------------------------------

def _dijkstra_fallback(distance_km: float) -> dict:
    """
    Build a minimal 3-node graph and compute shortest path as a placeholder.
    In production this would be replaced by a real road-network graph.
    """
    G = nx.Graph()
    G.add_edge("origin", "midpoint",    weight=distance_km * 0.6)
    G.add_edge("midpoint", "resource",  weight=distance_km * 0.4)
    path   = nx.dijkstra_path(G, "origin", "resource", weight="weight")
    length = nx.dijkstra_path_length(G, "origin", "resource", weight="weight")
    return {
        "distance_km": round(length, 2),
        "duration_s":  int(length / 40 * 3600),   # assume 40 km/h average
        "polyline":    [],                          # no real geometry in fallback
        "method":      "dijkstra_fallback",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def find_nearest_resource(
    incident_lat: float,
    incident_lon: float,
    resource_type: str,               # fire_station / hospital / police
) -> Optional[dict]:
    """
    1. Load all resources of the given type from Cosmos DB.
    2. Pick the closest one by Haversine (straight-line) as a candidate.
    3. Get the real road route via OSRM (or Dijkstra fallback).
    Returns a response dict or None if no resources found.
    """
    resources = get_resources_by_type(resource_type)
    if not resources:
        return None

    # Sort by straight-line distance
    def dist(r: dict) -> float:
        gps = r.get("gps", {})
        return haversine(incident_lat, incident_lon, gps.get("lat", 0), gps.get("lon", 0))

    nearest = min(resources, key=dist)
    gps     = nearest.get("gps", {})
    straight_km = dist(nearest)

    # Try OSRM first
    route = _osrm_route(incident_lat, incident_lon, gps["lat"], gps["lon"])
    if route is None:
        route = _dijkstra_fallback(straight_km)

    return {
        "resource_name":           nearest.get("name"),
        "resource_address":        nearest.get("address"),
        "resource_type":           resource_type,
        "distance_km":             route["distance_km"],
        "estimated_time_minutes":  max(1, round(route["duration_s"] / 60)),
        "polyline":                route.get("polyline", []),
    }
