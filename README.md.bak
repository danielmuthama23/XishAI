# CivicAI — Emergency & Civic Intelligence Platform

A full-stack AI-powered emergency response platform combining real-time incident reporting,
computer vision, GPT-4o reasoning, Hedera blockchain logging, and predictive risk analytics.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Mapbox GL JS, Tailwind CSS |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Vision AI | YOLOv11, CLIP, SAM (Segment Anything) |
| Language AI | Azure OpenAI GPT-4o |
| Database | Azure Cosmos DB |
| File storage | Azure Blob Storage |
| Search | Azure AI Search (RAG) |
| Blockchain | Hedera Hashgraph HCS |
| Routing | OSRM + Dijkstra |
| Notifications | Azure Communication Services |
| Predictions | Azure Machine Learning |
| Offline sync | IndexedDB + libp2p |

## Quick start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # fill in your keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local        # fill in your keys
npm run dev
```

Open http://localhost:5173

## Project structure

```
xishai/
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── incidents.py          # POST /api/incidents/report
│   │   ├── ai.py                 # POST /api/ai/query (RAG)
│   │   ├── routing.py            # GET  /api/routing/nearest
│   │   └── predictions.py       # GET  /api/predictions/{city}
│   ├── services/
│   │   ├── vision.py             # YOLOv11 + CLIP + SAM pipeline
│   │   ├── gpt.py                # Azure GPT-4o integration
│   │   ├── cosmos.py             # Cosmos DB CRUD
│   │   ├── blob.py               # Azure Blob Storage upload
│   │   ├── search.py             # Azure AI Search + RAG
│   │   ├── hedera.py             # Hedera HCS logging
│   │   ├── notify.py             # Azure Communication Services
│   │   └── routing_engine.py     # OSRM + Dijkstra
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   └── utils/
│       └── severity.py           # Severity scoring logic
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── SeverityBadge.jsx
│       │   ├── IncidentCard.jsx
│       │   ├── AIPanel.jsx
│       │   └── SearchPanel.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Map.jsx
│       │   ├── ReportForm.jsx
│       │   ├── AIAssistant.jsx
│       │   ├── Predictions.jsx
│       │   └── BlockchainLog.jsx
│       ├── hooks/
│       │   ├── useIncidents.js
│       │   ├── useAI.js
│       │   └── useOfflineSync.js
│       ├── services/
│       │   └── api.js            # All API calls to FastAPI
│       └── utils/
│           └── severity.js
└── docs/
    └── architecture.md
```
