"""
services/hedera.py
──────────────────
Log incident hashes to Hedera Hashgraph Consensus Service (HCS).

Flow:
  1. Serialise the incident document to a canonical JSON string
  2. SHA-256 hash it
  3. Submit the hash as a message to a pre-created HCS Topic
  4. Return the hash + consensus timestamp + sequence number
"""
from __future__ import annotations

import hashlib
import json
import os

from hedera import (
    Client,
    AccountId,
    PrivateKey,
    TopicId,
    TopicMessageSubmitTransaction,
)


def _get_client() -> Client:
    account_id  = AccountId.fromString(os.environ["HEDERA_ACCOUNT_ID"])
    private_key = PrivateKey.fromString(os.environ["HEDERA_PRIVATE_KEY"])
    network     = os.getenv("HEDERA_NETWORK", "mainnet")

    if network == "testnet":
        client = Client.forTestnet()
    else:
        client = Client.forMainnet()

    client.setOperator(account_id, private_key)
    return client


def hash_incident(incident_doc: dict) -> str:
    """
    Produce a deterministic SHA-256 hex digest of the incident document.
    Keys are sorted to ensure canonical serialisation.
    """
    canonical = json.dumps(incident_doc, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest().upper()


def log_to_hedera(incident_doc: dict) -> dict:
    """
    Hash and submit the incident to Hedera HCS.

    Returns:
        {
          "hash":              str,
          "sequence_number":   int,
          "consensus_timestamp": str,
        }
    """
    topic_id  = TopicId.fromString(os.environ["HEDERA_TOPIC_ID"])
    inc_hash  = hash_incident(incident_doc)
    client    = _get_client()

    receipt = (
        TopicMessageSubmitTransaction()
        .setTopicId(topic_id)
        .setMessage(inc_hash)
        .execute(client)
        .getReceipt(client)
    )

    return {
        "hash":                inc_hash,
        "sequence_number":     receipt.topicSequenceNumber,
        "consensus_timestamp": str(receipt.consensusTimestamp),
    }
