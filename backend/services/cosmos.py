"""Incident persistence with Cosmos DB and a development-safe local fallback."""
from __future__ import annotations

import os
from copy import deepcopy
from typing import List, Optional

try:
    from azure.cosmos import CosmosClient, exceptions
except ImportError:  # Keep the API usable when optional Azure packages are absent.
    CosmosClient = None
    exceptions = None

_client = None
_incidents: dict[str, dict] = {}
_resources: list[dict] = []
_cities: dict[str, dict] = {}

DATABASE = os.getenv("COSMOS_DATABASE", "civicai")
C_INC = os.getenv("COSMOS_CONTAINER_INCIDENTS", "incidents")
C_CITIES = os.getenv("COSMOS_CONTAINER_CITIES", "cities")
C_RES = os.getenv("COSMOS_CONTAINER_RESOURCES", "resources")


def _configured() -> bool:
    endpoint, key = os.getenv("COSMOS_ENDPOINT", ""), os.getenv("COSMOS_KEY", "")
    return bool(CosmosClient and endpoint and key and "YOUR_" not in endpoint and "your_" not in key)


def _db():
    global _client
    if not _configured():
        return None
    if _client is None:
        _client = CosmosClient(os.environ["COSMOS_ENDPOINT"], credential=os.environ["COSMOS_KEY"])
    return _client.get_database_client(DATABASE)


def create_incident(doc: dict) -> dict:
    database = _db()
    if database is None:
        _incidents[doc["id"]] = deepcopy(doc)
        return deepcopy(doc)
    return database.get_container_client(C_INC).create_item(body=doc)


def get_incident(incident_id: str) -> Optional[dict]:
    database = _db()
    if database is None:
        doc = _incidents.get(incident_id)
        return deepcopy(doc) if doc else None
    try:
        return database.get_container_client(C_INC).read_item(item=incident_id, partition_key=incident_id)
    except exceptions.CosmosResourceNotFoundError:
        return None


def list_incidents(city: Optional[str] = None, severity_min: int = 1,
                   status: Optional[str] = None, limit: int = 50) -> List[dict]:
    severity_min = max(1, min(10, severity_min))
    limit = max(1, min(100, limit))
    database = _db()
    if database is None:
        items = (doc for doc in _incidents.values()
                 if doc.get("severity", 0) >= severity_min
                 and (city is None or doc.get("city") == city)
                 and (status is None or doc.get("status") == status))
        return [deepcopy(doc) for doc in sorted(items, key=lambda d: d.get("timestamp", ""), reverse=True)[:limit]]

    clauses, parameters = ["c.severity >= @severity_min"], [{"name": "@severity_min", "value": severity_min}]
    if city:
        clauses.append("c.city = @city")
        parameters.append({"name": "@city", "value": city})
    if status:
        clauses.append("c.status = @status")
        parameters.append({"name": "@status", "value": status})
    query = f"SELECT * FROM c WHERE {' AND '.join(clauses)} ORDER BY c._ts DESC OFFSET 0 LIMIT {limit}"
    return list(database.get_container_client(C_INC).query_items(
        query=query, parameters=parameters, enable_cross_partition_query=True))


def update_incident(incident_id: str, updates: dict) -> dict:
    doc = get_incident(incident_id)
    if not doc:
        raise ValueError(f"Incident {incident_id} not found")
    doc.update(updates)
    database = _db()
    if database is None:
        _incidents[incident_id] = deepcopy(doc)
        return deepcopy(doc)
    return database.get_container_client(C_INC).replace_item(item=incident_id, body=doc)


def add_crowd_confirmation(incident_id: str, user_id: str) -> dict:
    doc = get_incident(incident_id)
    if not doc:
        raise ValueError(f"Incident {incident_id} not found")
    confirmed = doc.setdefault("confirmed_by", [])
    if user_id not in confirmed:
        confirmed.append(user_id)
    doc["verified"] = len(confirmed) >= 3
    return update_incident(incident_id, {"confirmed_by": confirmed, "verified": doc["verified"]})


def get_resources_by_type(resource_type: str) -> List[dict]:
    database = _db()
    if database is None:
        return [deepcopy(resource) for resource in _resources if resource.get("type") == resource_type]
    query = "SELECT * FROM c WHERE c.type = @type"
    return list(database.get_container_client(C_RES).query_items(
        query=query, parameters=[{"name": "@type", "value": resource_type}], enable_cross_partition_query=True))


def upsert_city_stats(city_doc: dict) -> dict:
    database = _db()
    if database is None:
        _cities[city_doc["id"]] = deepcopy(city_doc)
        return deepcopy(city_doc)
    return database.get_container_client(C_CITIES).upsert_item(body=city_doc)
