/**
 * services/api.js
 * ───────────────
 * Centralised API client for all FastAPI backend calls.
 * Base URL is set from VITE_API_BASE_URL env var (default: http://localhost:8000).
 */
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE,
  timeout: 30_000,
})

// ─── Incidents ────────────────────────────────────────────────────────────────

async function reportIncident(formData) {
  // formData is a FormData object (handles files + fields)
  const { data } = await client.post('/api/incidents/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

async function listIncidents({ city, severityMin, status, limit = 50 } = {}) {
  const params = {}
  if (city)        params.city         = city
  if (severityMin) params.severity_min = severityMin
  if (status)      params.status       = status
  if (limit)       params.limit        = limit
  const { data } = await client.get('/api/incidents/', { params })
  return data
}

async function getIncident(id) {
  const { data } = await client.get(`/api/incidents/${id}`)
  return data
}

async function confirmIncident(id, userId) {
  const fd = new FormData()
  fd.append('user_id', userId)
  const { data } = await client.post(`/api/incidents/${id}/confirm`, fd)
  return data
}

// ─── AI / RAG ─────────────────────────────────────────────────────────────────

async function ragQuery({ question, city_filter, severity_min, time_window_hours }) {
  const { data } = await client.post('/api/ai/query', {
    question,
    city_filter,
    severity_min,
    time_window_hours,
  })
  return data
}

async function analyseVoice(audioFile) {
  const fd = new FormData()
  fd.append('audio', audioFile)
  const { data } = await client.post('/api/ai/voice', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchIncidents(query, city, severityMin) {
  // Delegates to the RAG endpoint; can also hit /api/ai/query
  const { data } = await client.post('/api/ai/query', {
    question:    query,
    city_filter: city,
    severity_min: severityMin,
  })
  // Return source IDs as minimal incident stubs
  return (data.source_incident_ids ?? []).map(id => ({ id }))
}

// ─── Routing ──────────────────────────────────────────────────────────────────

async function getNearestResource(lat, lon, resourceType = 'fire_station') {
  const { data } = await client.get('/api/routing/nearest', {
    params: { lat, lon, resource_type: resourceType },
  })
  return data
}

// ─── Predictions ──────────────────────────────────────────────────────────────

async function getCityPrediction(city, windowHours = 24) {
  const { data } = await client.get(`/api/predictions/${city}`, {
    params: { window_hours: windowHours },
  })
  return data
}

// ─── Health ───────────────────────────────────────────────────────────────────

async function healthCheck() {
  const { data } = await client.get('/health')
  return data
}

export const api = {
  reportIncident,
  listIncidents,
  getIncident,
  confirmIncident,
  ragQuery,
  analyseVoice,
  searchIncidents,
  getNearestResource,
  getCityPrediction,
  healthCheck,
}
