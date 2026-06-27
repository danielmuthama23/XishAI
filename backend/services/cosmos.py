"""
services/cosmos.py
──────────────────
Azure Cosmos DB CRUD for incidents, cities, resources.
"""
from __future__ import annotations

import os
from typing import Any, List, Optional
from azure.cosmos import CosmosClient, PartitionKey, exceptions

_client: CosmosClient | None = None

DATABASE  = os.getenv("COSMOS_DATABASE", "civicai")
C_INC     = os.getenv("COSMOS_CONTAINER_INCIDENTS",  "incidents")
C_CITIES  = os.getenv("COSMOS_CONTAINER_CITIES",     "cities")
C_RES     = os.getenv("COSMOS_CONTAINER_RESOURCES",  "resources")


def _db():
    global _client
    if _client is None:
        _client = CosmosClient(
            os.environ["COSMOS_ENDPOINT"],
            credential=os.environ["COSMOS_KEY"],
        )
    return _client.get_database_client(DATABASE)


# ---------------------------------------------------------------------------
# Incidents
# ---------------------------------------------------------------------------

def create_incident(doc: dict) -> dict:
    """Insert a new incident document. Returns the created doc."""
    container = _db().get_container_client(C_INC)
    return container.create_item(body=doc)


def get_incident(incident_id: str) -> Optional[dict]:
    try:
        container = _db().get_container_client(C_INC)
        return container.read_item(item=incident_id, partition_key=incident_id)
    except exceptions.CosmosResourceNotFoundError:
        return None


def list_incidents(
    city: Optional[str] = None,
    severity_min: int = 1,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[dict]:
    """Query incidents with optional filters."""
    container = _db().get_container_client(C_INC)
    clauses = [f"c.severity >= {severity_min}"]
    if city:
        clauses.append(f"c.city = '{city}'")
    if status:
        clauses.append(f"c.status = '{status}'")
    where = " AND ".join(clauses)
    query  = f"SELECT * FROM c WHERE {where} ORDER BY c._ts DESC OFFSET 0 LIMIT {limit}"
    return list(container.query_items(query=query, enable_cross_partition_query=True))


def update_incident(incident_id: str, updates: dict) -> dict:
    """Merge updates into an existing incident document."""
    doc = get_incident(incident_id)
    if not doc:
        raise ValueError(f"Incident {incident_id} not found")
    doc.update(updates)
    container = _db().get_container_client(C_INC)
    return container.replace_item(item=incident_id, body=doc)


def add_crowd_confirmation(incident_id: str, user_id: str) -> dict:
    """Append a user confirmation to the crowd_confirmations array."""
    doc = get_incident(incident_id)
    if not doc:
        raise ValueError(f"Incident {incident_id} not found")
    confirmed = doc.get("confirmed_by", [])
    if user_id not in confirmed:
        confirmed.append(user_id)
    doc["confirmed_by"] = confirmed
    doc["verified"] = len(confirmed) >= 3
    container = _db().get_container_client(C_INC)
    return container.replace_item(item=incident_id, body=doc)


# ---------------------------------------------------------------------------
# Resources (fire stations, hospitals, police)
# ---------------------------------------------------------------------------

def get_resources_by_type(resource_type: str) -> List[dict]:
    container = _db().get_container_client(C_RES)
    query = f"SELECT * FROM c WHERE c.type = '{resource_type}'"
    return list(container.query_items(query=query, enable_cross_partition_query=True))


# ---------------------------------------------------------------------------
# City index
# ---------------------------------------------------------------------------

def upsert_city_stats(city_doc: dict) -> dict:
    container = _db().get_container_client(C_CITIES)
    return container.upsert_item(body=city_doc)
