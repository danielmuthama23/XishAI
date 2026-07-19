"""
routers/ai.py
─────────────
POST /api/ai/query   — RAG Q&A: search → retrieve → GPT
POST /api/ai/voice   — Transcribe audio + stress estimation
"""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional

from models.schemas import RAGQueryRequest, RAGQueryResponse
from services import gpt
from services.search import search_incidents

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/ai/query — RAG pipeline
# ---------------------------------------------------------------------------

@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(req: RAGQueryRequest):
    """
    1. Azure AI Search — find relevant incidents
    2. GPT-4o — ground the answer in retrieved documents
    """
    retrieved = search_incidents(
        query         = req.question,
        city_filter   = req.city_filter,
        severity_min  = req.severity_min,
        top           = 10,
    )

    if not retrieved:
        return RAGQueryResponse(
            answer="No incidents match your query in the current dataset.",
            source_incident_ids=[],
            confidence=0.0,
        )

    answer = gpt.rag_answer(question=req.question, retrieved_incidents=retrieved)

    return RAGQueryResponse(
        answer               = answer,
        source_incident_ids  = [r["id"] for r in retrieved],
        confidence           = 0.85,   # placeholder; real confidence from embeddings
    )


# ---------------------------------------------------------------------------
# POST /api/ai/voice — Azure Speech → text + GPT urgency
# ---------------------------------------------------------------------------

class VoiceAnalysisResponse(BaseModel):
    transcript: str
    urgency:    int
    cues:       list[str]


@router.post("/voice", response_model=VoiceAnalysisResponse)
async def analyse_voice(audio: UploadFile = File(...)):
    """
    1. Azure Speech Services → transcript
    2. GPT-4o → urgency estimation from linguistic cues
    """
    audio_bytes = await audio.read()
    transcript  = await _azure_speech_to_text(audio_bytes, audio.content_type)
    urgency_data = gpt.estimate_voice_urgency(transcript)

    return VoiceAnalysisResponse(
        transcript = transcript,
        urgency    = urgency_data.get("urgency", 0),
        cues       = urgency_data.get("cues", []),
    )


async def _azure_speech_to_text(audio_bytes: bytes, content_type: str | None) -> str:
    """
    Transcribe audio using Azure Cognitive Services Speech SDK.
    Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION env vars.
    """
    import os
    import tempfile
    from pathlib import Path

    key    = os.environ.get("AZURE_SPEECH_KEY", "")
    region = os.environ.get("AZURE_SPEECH_REGION", "eastus")

    if not key:
        return "(speech service not configured)"

    try:
        import azure.cognitiveservices.speech as speechsdk
    except ImportError:
        return "(speech service SDK is not installed)"

    # Write bytes to a temp file for the SDK
    ext = "wav" if "wav" in (content_type or "") else "mp3"
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        config  = speechsdk.SpeechConfig(subscription=key, region=region)
        audio_c = speechsdk.AudioConfig(filename=tmp_path)
        recognizer = speechsdk.SpeechRecognizer(speech_config=config, audio_config=audio_c)
        result = recognizer.recognize_once()
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text
    return "(could not transcribe audio)"
