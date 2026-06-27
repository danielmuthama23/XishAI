"""
services/notify.py
──────────────────
Send notifications via Azure Communication Services when severity >= 7.
Channels: Email · SMS · (WhatsApp via ACS channel)
"""
from __future__ import annotations

import os
from typing import List

from azure.communication.email import EmailClient
from azure.communication.sms import SmsClient

SENDER_EMAIL = os.getenv("ACS_SENDER_EMAIL", "alerts@civicai.azurecomm.net")
SENDER_PHONE = os.getenv("ACS_SENDER_PHONE", "+10000000000")

# Authority contacts — in production, load from Cosmos DB / config
AUTHORITY_EMAILS = os.getenv("AUTHORITY_EMAILS", "responders@example.com").split(",")
AUTHORITY_PHONES = os.getenv("AUTHORITY_PHONES", "+254700000000").split(",")


def _email_client() -> EmailClient:
    return EmailClient.from_connection_string(os.environ["ACS_CONNECTION_STRING"])


def _sms_client() -> SmsClient:
    return SmsClient.from_connection_string(os.environ["ACS_CONNECTION_STRING"])


def send_alert(incident: dict) -> List[str]:
    """
    Fire notifications for the given incident.
    Returns a list of channels that were notified.
    """
    severity = incident.get("severity", 0)
    if severity < 7:
        return []

    subject = f"[CivicAI ALERT] {incident.get('type')} — Severity {severity}/10 in {incident.get('city')}"
    body    = _build_email_body(incident)
    sms_msg = _build_sms_body(incident)

    notified: List[str] = []

    # ── Email ──────────────────────────────────────────────────────────────
    try:
        client = _email_client()
        message = {
            "senderAddress": SENDER_EMAIL,
            "recipients": {
                "to": [{"address": addr} for addr in AUTHORITY_EMAILS]
            },
            "content": {
                "subject": subject,
                "plainText": body,
            },
        }
        poller = client.begin_send(message)
        poller.result()
        notified.append("email")
    except Exception as exc:
        print(f"[notify] Email failed: {exc}")

    # ── SMS ────────────────────────────────────────────────────────────────
    try:
        client = _sms_client()
        client.send(
            from_=SENDER_PHONE,
            to=AUTHORITY_PHONES,
            message=sms_msg[:160],
        )
        notified.append("sms")
    except Exception as exc:
        print(f"[notify] SMS failed: {exc}")

    return notified


def _build_email_body(incident: dict) -> str:
    analysis = incident.get("ai_analysis", {})
    return (
        f"EMERGENCY ALERT — CivicAI\n\n"
        f"Type:           {incident.get('type')}\n"
        f"Location:       {incident.get('area')}, {incident.get('city')}\n"
        f"Severity:       {incident.get('severity')}/10 ({incident.get('risk_level')})\n"
        f"Recommendation: {analysis.get('recommendation', 'N/A')}\n"
        f"Incident ID:    {incident.get('id')}\n"
        f"Blockchain hash:{incident.get('hedera_hash', 'pending')}\n\n"
        f"Respond at: https://civicai.example.com/incidents/{incident.get('id')}\n"
    )


def _build_sms_body(incident: dict) -> str:
    return (
        f"CivicAI ALERT: {incident.get('type')} in {incident.get('city')} "
        f"Sev {incident.get('severity')}/10. "
        f"ID: {incident.get('id')}"
    )
