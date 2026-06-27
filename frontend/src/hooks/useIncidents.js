/**
 * hooks/useIncidents.js
 * ─────────────────────
 * Fetch and cache incident data from the FastAPI backend.
 * Falls back to static mock data when the API is unavailable.
 */
import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

// Static mock data shown while API is loading / unavailable
export const MOCK_INCIDENTS = [
  { id:'INC-001', type:'Fire',             city:'Mombasa', area:'Changamwe', severity:9, lat:-4.05, lng:39.62, time:'14:23', verified:true,  hash:'A9F3B812C7D4E501', responders:['Fire Dept.'],         status:'Critical' },
  { id:'INC-002', type:'Flood',            city:'Nairobi', area:'Westlands', severity:7, lat:-1.27, lng:36.81, time:'13:45', verified:true,  hash:'B7E2C934A1D8F620', responders:['County DRM'],          status:'Active'   },
  { id:'INC-003', type:'Medical',          city:'Kisumu',  area:'Milimani',  severity:6, lat:-0.10, lng:34.75, time:'12:58', verified:false, hash:'C5A1D073B2E9F741', responders:['Ambulance'],           status:'Pending'  },
  { id:'INC-004', type:'Accident',         city:'Nakuru',  area:'CBD',       severity:8, lat:-0.30, lng:36.07, time:'11:30', verified:true,  hash:'D3F0E162C4A7B853', responders:['Traffic police'],      status:'Active'   },
  { id:'INC-005', type:'Power outage',     city:'Eldoret', area:'Huruma',    severity:4, lat:0.52,  lng:35.27, time:'10:15', verified:false, hash:'E1C9F285D3B6A964', responders:['KPLC'],               status:'Monitoring'},
  { id:'INC-006', type:'Security',         city:'Mombasa', area:'Nyali',     severity:5, lat:-4.02, lng:39.72, time:'09:40', verified:true,  hash:'F8D7A396E2C5B075', responders:['Police'],              status:'Active'   },
  { id:'INC-007', type:'Building collapse',city:'Nairobi', area:'Eastleigh', severity:9, lat:-1.28, lng:36.85, time:'08:55', verified:true,  hash:'G6B4E207F1D3C186', responders:['Fire Dept.','Rescue'], status:'Critical' },
]

export function useIncidents(filters = {}) {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listIncidents(filters)
      if (data && data.length > 0) setIncidents(data)
    } catch (err) {
      // API not available — keep mock data, surface a soft warning
      setError('Using offline data — backend not reachable')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  return { incidents, loading, error, refetch: fetch }
}
