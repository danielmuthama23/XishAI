"""
services/blob.py
────────────────
Upload media (images, audio, video) to Azure Blob Storage.
Cosmos DB stores only the resulting URL.
"""
from __future__ import annotations

import os
import uuid
from typing import Optional

from azure.storage.blob import BlobServiceClient, ContentSettings

_blob_service: BlobServiceClient | None = None
CONTAINER = os.getenv("BLOB_CONTAINER_MEDIA", "civicai-media")


def _service() -> BlobServiceClient:
    global _blob_service
    if _blob_service is None:
        _blob_service = BlobServiceClient.from_connection_string(
            os.environ["BLOB_CONNECTION_STRING"]
        )
    return _blob_service


def upload_media(
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
    incident_id: str,
) -> str:
    """
    Upload a media file to Blob Storage under  <incident_id>/<uuid>.<ext>
    Returns the public URL string.
    """
    ext       = original_filename.rsplit(".", 1)[-1].lower()
    blob_name = f"{incident_id}/{uuid.uuid4().hex}.{ext}"

    container_client = _service().get_container_client(CONTAINER)
    container_client.upload_blob(
        name=blob_name,
        data=file_bytes,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )

    account_name = _service().account_name
    return f"https://{account_name}.blob.core.windows.net/{CONTAINER}/{blob_name}"


def delete_media(blob_url: str) -> None:
    """Remove a blob given its full URL (used when incident is retracted)."""
    # Extract blob name from URL
    parts     = blob_url.split(f"/{CONTAINER}/", 1)
    blob_name = parts[1] if len(parts) == 2 else None
    if blob_name:
        _service().get_blob_client(container=CONTAINER, blob=blob_name).delete_blob()
