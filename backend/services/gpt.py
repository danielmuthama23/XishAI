"""
services/gpt.py
───────────────
Azure OpenAI GPT-4o integration for:
  • Emergency analysis (severity scoring + recommendation)
  • RAG-grounded Q&A over retrieved incidents
  • Voice transcript analysis
"""
from __future__ import annotations

import os
try:
    from openai import AzureOpenAI
except ImportError:
    AzureOpenAI = None

_client: AzureOpenAI | None = None


def _get_client() -> AzureOpenAI:
    global _client
    if AzureOpenAI is None:
        raise RuntimeError("OpenAI SDK is not installed")
    if _client is None:
        _client = AzureOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_key=os.environ["AZURE_OPENAI_KEY"],
            api_version="2024-02-01",
        )
    return _client


DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")


def _configured() -> bool:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    key = os.getenv("AZURE_OPENAI_KEY", "")
    return bool(AzureOpenAI and endpoint and key and "YOUR_" not in endpoint and "your_" not in key)


# ---------------------------------------------------------------------------
# Emergency analysis
# ---------------------------------------------------------------------------

ANALYSIS_SYSTEM = """
You are an emergency triage AI for the CivicAI platform, deployed across Kenya.
Given multimodal inputs (detected objects, scene description, voice transcript,
location, past incident context), you MUST return a JSON object with EXACTLY
these fields:
{
  "severity": <integer 1-10>,
  "incident_type": <string>,
  "risk_level": <"Info"|"Minor"|"Moderate"|"Serious"|"Critical">,
  "recommendation": <string — one concise actionable sentence>,
  "confidence": <float 0-1>
}
Do not include markdown fences or any text outside the JSON.
""".strip()


def analyse_emergency(
    detected_objects: list[str],
    clip_scene: str,
    sam_summary: str,
    voice_transcript: str,
    location: str,
    past_incidents: list[str],
) -> dict:
    """
    Call GPT-4o to produce a structured emergency analysis.
    Returns parsed JSON dict.
    """
    if not _configured():
        severity = 7 if any(word in (voice_transcript + " " + clip_scene).lower()
                                     for word in ("fire", "collapse", "trapped", "bleeding", "explosion")) else 5
        return {
            "severity": severity,
            "incident_type": clip_scene or "Reported incident",
            "risk_level": "Serious" if severity >= 7 else "Moderate",
            "recommendation": "Dispatch an appropriate responder and verify the situation immediately.",
            "confidence": 0.35,
        }

    user_prompt = f"""
Analyse this emergency report:

LOCATION: {location}

VISION — detected objects: {', '.join(detected_objects) or 'none'}
VISION — scene (CLIP): {clip_scene}
VISION — SAM summary: {sam_summary}

VOICE TRANSCRIPT: {voice_transcript or '(none provided)'}

PAST INCIDENTS IN AREA (last 24h): {'; '.join(past_incidents) or 'none'}

Return only the JSON object.
""".strip()

    response = _get_client().chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": ANALYSIS_SYSTEM},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=300,
        response_format={"type": "json_object"},
    )

    import json
    return json.loads(response.choices[0].message.content)


# ---------------------------------------------------------------------------
# RAG — grounded Q&A
# ---------------------------------------------------------------------------

RAG_SYSTEM = """
You are CivicAI, an emergency intelligence assistant for Kenyan civil authorities.
You will be given a set of retrieved incident records and a user question.
Answer ONLY using the provided records — do not hallucinate facts.
Be concise, factual, and prioritise life-safety information.
""".strip()


def rag_answer(question: str, retrieved_incidents: list[dict]) -> str:
    """
    Generate a grounded natural-language answer using retrieved incident docs.
    retrieved_incidents: list of Cosmos DB incident documents (dicts).
    """
    if not _configured():
        summary = "; ".join(
            f"{inc.get('id')}: {inc.get('type')} in {inc.get('area')}, {inc.get('city')} (severity {inc.get('severity')}/10, {inc.get('status')})"
            for inc in retrieved_incidents
        )
        return f"Matching incidents: {summary}."

    context = "\n\n".join(
        f"[{inc.get('id')}] {inc.get('type')} — {inc.get('area')}, {inc.get('city')}. "
        f"Severity {inc.get('severity')}/10. Status: {inc.get('status')}. "
        f"Responders: {', '.join(inc.get('responders', []))}."
        for inc in retrieved_incidents
    )

    messages = [
        {"role": "system",  "content": RAG_SYSTEM},
        {"role": "user",    "content": f"INCIDENTS:\n{context}\n\nQUESTION: {question}"},
    ]

    response = _get_client().chat.completions.create(
        model=DEPLOYMENT,
        messages=messages,
        temperature=0.3,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Voice transcript stress estimation
# ---------------------------------------------------------------------------

STRESS_SYSTEM = """
You are a vocal stress analysis model. Given only a text transcript (speech-to-text),
estimate the urgency/stress level from linguistic cues (word choice, sentence fragmentation,
repetition, exclamation). Return ONLY a JSON with:
{"urgency": <0-10>, "cues": [<string>, ...]}
""".strip()


def estimate_voice_urgency(transcript: str) -> dict:
    """
    Estimate urgency from voice transcript text.
    Note: this is a supplementary signal, not definitive evidence.
    """
    if not transcript:
        return {"urgency": 0, "cues": []}

    if not _configured():
        lower = transcript.lower()
        cues = [word for word in ("help", "fire", "trapped", "bleeding", "urgent") if word in lower]
        return {"urgency": min(10, len(cues) * 2 + (2 if "!" in transcript else 0)), "cues": cues}

    import json
    response = _get_client().chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {"role": "system", "content": STRESS_SYSTEM},
            {"role": "user",   "content": transcript},
        ],
        temperature=0.1,
        max_tokens=150,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
