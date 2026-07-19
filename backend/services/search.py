"""
services/search.py
──────────────────
Azure AI Search integration.
  • index_incident()   — push a new incident into the search index
  • search_incidents() — full-text + vector hybrid search
Used by the RAG pipeline: search → retrieve docs → GPT grounds the answer.
"""
from __future__ import annotations

import os
from typing import Any, List, Optional

try:
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents import SearchClient
except ImportError:
    AzureKeyCredential = None
    SearchClient = None

ENDPOINT    = os.getenv("SEARCH_ENDPOINT", "")
KEY         = os.getenv("SEARCH_KEY", "")
INDEX_NAME  = os.getenv("SEARCH_INDEX", "incidents-index")

_search_client: SearchClient | None = None


def _client() -> SearchClient:
    global _search_client
    if SearchClient is None or not ENDPOINT or not KEY or "YOUR_" in ENDPOINT or "your_" in KEY:
        raise RuntimeError("Azure AI Search is not configured")
    if _search_client is None:
        _search_client = SearchClient(
            endpoint=ENDPOINT,
            index_name=INDEX_NAME,
            credential=AzureKeyCredential(KEY),
        )
    return _search_client


# ---------------------------------------------------------------------------
# Index schema (must match index created in Azure portal / via SDK):
#   id, type, city, area, severity, status, description, timestamp, embedding
# ---------------------------------------------------------------------------

def index_incident(incident: dict) -> None:
    """
    Push a Cosmos DB incident document into the Azure AI Search index.
    Call this immediately after create_incident() in cosmos.py.
    """
    if not (SearchClient and ENDPOINT and KEY and "YOUR_" not in ENDPOINT and "your_" not in KEY):
        return
    doc = {
        "id":          incident["id"],
        "type":        incident.get("type", ""),
        "city":        incident.get("city", ""),
        "area":        incident.get("area", ""),
        "severity":    incident.get("severity", 1),
        "status":      incident.get("status", "Pending"),
        "description": incident.get("ai_analysis", {}).get("recommendation", ""),
        "timestamp":   str(incident.get("timestamp", "")),
    }
    _client().upload_documents(documents=[doc])


def search_incidents(
    query: str,
    city_filter: Optional[str] = None,
    severity_min: Optional[int] = None,
    top: int = 10,
) -> List[dict]:
    """
    Full-text search over indexed incidents.
    Returns a list of result dicts.
    """
    if not (SearchClient and ENDPOINT and KEY and "YOUR_" not in ENDPOINT and "your_" not in KEY):
        from services.cosmos import list_incidents
        terms = [term.lower() for term in query.split() if term]
        return [incident for incident in list_incidents(city=city_filter, severity_min=severity_min or 1, limit=top)
                if not terms or any(term in " ".join(str(incident.get(field, "")) for field in ("type", "description", "area", "city")).lower() for term in terms)]

    filter_parts: List[str] = []
    if city_filter:
        filter_parts.append(f"city eq '{city_filter}'")
    if severity_min is not None:
        filter_parts.append(f"severity ge {severity_min}")

    odata_filter = " and ".join(filter_parts) if filter_parts else None

    results = _client().search(
        search_text=query,
        filter=odata_filter,
        top=top,
        select=["id", "type", "city", "area", "severity", "status", "description", "timestamp"],
    )
    return [dict(r) for r in results]
