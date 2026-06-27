import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { useIncidents } from '../hooks/useIncidents'
import { severityColor, severityLabel, incidentEmoji } from '../utils/severity'
import IncidentCard from '../components/IncidentCard'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export default function MapPage() {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const [selected, setSelected] = useState(null)

  const { incidents } = useIncidents()

  // Initialise map once
  useEffect(() => {
    if (mapRef.current || !mapboxgl.accessToken) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    [37.9, -0.5],   // Kenya centre
      zoom:      5.8,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }, [])

  // Add / refresh markers whenever incidents change
  useEffect(() => {
    if (!mapRef.current) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    incidents.forEach(incident => {
      // Fallback coordinates if lat/lng missing
      const lng = incident.lng ?? incident.gps?.lon ?? 37.9
      const lat = incident.lat ?? incident.gps?.lat ?? -0.5

      // Custom HTML marker element
      const el = document.createElement('div')
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${severityColor(incident.severity)};
        border: 2px solid rgba(255,255,255,0.3);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 11px; color: white; font-weight: 700;
        box-shadow: 0 0 0 4px ${severityColor(incident.severity)}33;
        animation: ping-slow 2s ease-in-out infinite;
      `
      el.title = `${incident.type} — ${incident.area}`

      // Popup
      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false })
        .setHTML(`
          <div style="min-width:160px">
            <div style="font-weight:600;margin-bottom:4px">${incidentEmoji(incident.type)} ${incident.type}</div>
            <div style="color:#9ca3af;font-size:12px">📍 ${incident.area}, ${incident.city}</div>
            <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
              <span style="background:${severityColor(incident.severity)}22;color:${severityColor(incident.severity)};
                           border:1px solid ${severityColor(incident.severity)}55;border-radius:4px;
                           padding:1px 6px;font-size:11px;font-weight:600">
                Sev ${incident.severity} — ${severityLabel(incident.severity)}
              </span>
            </div>
            <div style="color:#6b7280;font-size:11px;margin-top:4px">${incident.status} · ${incident.time ?? ''}</div>
          </div>
        `)

      el.addEventListener('click', () => setSelected(incident))

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current)

      markersRef.current.push(marker)
    })
  }, [incidents])

  const hasToken = !!import.meta.env.VITE_MAPBOX_TOKEN

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-gray-800" style={{ height: 480 }}>
        {hasToken ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          /* Fallback SVG map when no Mapbox token */
          <FallbackMap incidents={incidents} onSelect={setSelected} />
        )}

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 bg-gray-950/80 backdrop-blur rounded-lg px-3 py-2 flex gap-4 text-xs">
          {[['Critical','#E24B4A'],['Serious','#EF9F27'],['Moderate','#DDB929'],['Minor','#378ADD']].map(([l,c]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-gray-400">{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom cards row */}
      <div className="grid grid-cols-3 gap-3">
        {incidents.slice(0, 3).map(i => (
          <IncidentCard key={i.id} incident={i} />
        ))}
      </div>

      {/* Selected incident detail panel */}
      {selected && (
        <div className="card border-blue-800">
          <div className="flex items-start justify-between mb-2">
            <div className="font-semibold text-gray-100">{selected.type} — {selected.area}, {selected.city}</div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-lg leading-none">✕</button>
          </div>
          <div className="text-sm text-gray-400">
            <span className="mr-3">Sev {selected.severity}</span>
            <span className="mr-3">{selected.status}</span>
            {selected.verified && <span className="text-emerald-400">✓ Verified</span>}
          </div>
          {selected.responders?.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              🚒 {Array.isArray(selected.responders) ? selected.responders.join(', ') : selected.responders}
            </div>
          )}
          <div className="text-xs text-gray-600 mt-1 font-mono">Hash: {selected.hash}</div>
        </div>
      )}
    </div>
  )
}

// SVG fallback rendered when VITE_MAPBOX_TOKEN is not set
function FallbackMap({ incidents, onSelect }) {
  // Project lat/lng to SVG coordinates (rough Kenya bounding box)
  function project(lat, lng) {
    const x = ((lng - 33.9) / (41.9 - 33.9)) * 580 + 10
    const y = ((-4.7 - lat) / (-4.7 - 4.6)) * -440 + 10
    return { x, y }
  }

  return (
    <svg viewBox="0 0 600 460" className="w-full h-full" style={{ background: '#0f1623' }}>
      {/* Grid */}
      {[100,200,300,400,500].map(x => (
        <line key={`vl${x}`} x1={x} y1={0} x2={x} y2={460} stroke="#1f2937" strokeWidth="0.5" />
      ))}
      {[100,200,300,400].map(y => (
        <line key={`hl${y}`} x1={0} y1={y} x2={600} y2={y} stroke="#1f2937" strokeWidth="0.5" />
      ))}
      {/* Kenya silhouette approximation */}
      <path
        d="M120,30 Q200,10 300,40 Q420,70 470,160 Q520,250 460,360 Q400,430 300,420 Q200,410 140,350 Q80,290 60,180 Q40,90 120,30Z"
        fill="#1D9E7511" stroke="#1D9E7533" strokeWidth="1"
      />
      {/* Incident markers */}
      {incidents.map(inc => {
        const { x, y } = project(inc.lat ?? inc.gps?.lat ?? -0.5, inc.lng ?? inc.gps?.lon ?? 37.9)
        const color = severityColor(inc.severity)
        return (
          <g key={inc.id} transform={`translate(${x},${y})`} onClick={() => onSelect(inc)} style={{ cursor: 'pointer' }}>
            <circle r="14" fill={color} opacity="0.15" className="pulse-ring" />
            <circle r="8"  fill={color} opacity="0.85" />
            <circle r="3"  fill="white" opacity="0.9" />
            <title>{inc.type} — {inc.area}</title>
          </g>
        )
      })}
      <text x="12" y="22" fill="white" fontSize="12" opacity="0.7" fontFamily="sans-serif">Kenya — Live incident map</text>
      <text x="12" y="38" fill="#34d399" fontSize="10" opacity="0.8" fontFamily="sans-serif">{incidents.length} active incidents</text>
      <text x="12" y="450" fill="#4b5563" fontSize="9" fontFamily="sans-serif">Add VITE_MAPBOX_TOKEN for full Mapbox map</text>
    </svg>
  )
}
