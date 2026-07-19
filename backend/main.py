"""
CivicAI Backend — FastAPI entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import incidents, ai, routing, predictions

load_dotenv()

app = FastAPI(
    title="CivicAI API",
    description="Emergency & Civic Intelligence Platform",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React dev server and any production domain
# ---------------------------------------------------------------------------
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["AI"])
app.include_router(routing.router,   prefix="/api/routing",   tags=["Routing"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CivicAI"}
