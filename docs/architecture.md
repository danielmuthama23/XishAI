# CivicAI Architecture

## End-to-end request flow

```
Citizen
   │
   ▼
React Frontend  (Vite + Tailwind + Mapbox GL)
   │  POST /api/incidents/report  (multipart/form-data)
   ▼
FastAPI Backend  (Python 3.11, Uvicorn)
   │
   ├── 1. Upload media ──────────────────► Azure Blob Storage
   │
   ├── 2. Vision pipeline
   │       YOLOv11  (object detection)
   │       CLIP     (semantic scene embedding)
   │       SAM      (segment anything)
   │
   ├── 3. Azure GPT-4o reasoning ────────► severity + recommendation
   │
   ├── 4. Store document ────────────────► Azure Cosmos DB
   │
   ├── 5. Index ─────────────────────────► Azure AI Search
   │
   ├── 6. Hash + log ────────────────────► Hedera Hashgraph HCS
   │
   ├── 7. Route to resource ─────────────► OSRM + Dijkstra
   │
   └── 8. Notify authorities ────────────► Azure Communication Services
                                           (SMS + Email + WhatsApp)
```

## AI pipeline detail

| Step | Model | Purpose | Output |
|------|-------|---------|--------|
| 1 | YOLOv11 | Object detection | ["fire","smoke","person"] |
| 2 | CLIP ViT-B/32 | Scene understanding | "Structure fire with trapped occupants" |
| 3 | SAM vit_h | Region segmentation | 12 masks, largest 34% of image |
| 4 | GPT-4o | Multimodal reasoning | severity:9, recommendation: "..." |

## Severity scale

| Score | Label | Colour | Action |
|-------|-------|--------|--------|
| 1–2 | Info | White | Log only |
| 3–4 | Minor | Blue | Monitor |
| 5–6 | Moderate | Yellow | Notify county |
| 7–8 | Serious | Orange | Dispatch + notify |
| 9–10 | Critical | Red | All channels + escalate |

## Offline sync

1. Service worker + IndexedDB queues reports when offline
2. libp2p mesh propagates queued reports peer-to-peer
3. On reconnection, `useOfflineSync` replays queue against `/api/incidents/report`
4. Backend deduplicates via Hedera hash comparison

## Crowd verification

- 3 independent confirmations from different users → `verified: true`
- Verification raises severity by 1 (capped at 10)
- Each confirmation stored in `confirmed_by[]` array in Cosmos DB

## Blockchain (Hedera HCS)

```
incident_doc  →  JSON.dumps(sort_keys=True)  →  SHA-256  →  hex digest
                                                               │
                                               TopicMessageSubmitTransaction
                                                               │
                                              Consensus Service receipt
                                              (sequence_number + timestamp)
```

## Routing engine

1. Load resource list from Cosmos DB by type
2. Haversine sort → pick nearest candidate
3. OSRM `/route/v1/driving` → real road distance + polyline
4. Fallback: Dijkstra over synthetic 3-node graph (dev / offline)

## RAG pipeline

```
User question
     │
Azure AI Search  →  top-10 relevant incidents
     │
GPT-4o system prompt: "Answer ONLY using provided records"
     │
Grounded natural-language answer
```
