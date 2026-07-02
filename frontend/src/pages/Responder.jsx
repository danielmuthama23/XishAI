import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Resource data (fallback when API unavailable) ──────────────────────────
const RESOURCES = {
  fire: [
    { name: 'Changamwe Fire Station',    phone: '+254 41 343 0001', lat: -4.047, lng: 39.617, city: 'Mombasa'  },
    { name: 'Nairobi Central Fire Stn',  phone: '+254 20 222 2181', lat: -1.283, lng: 36.816, city: 'Nairobi'  },
    { name: 'Kisumu Fire Brigade',        phone: '+254 57 202 1333', lat: -0.091, lng: 34.768, city: 'Kisumu'   },
    { name: 'Nakuru Fire Station',        phone: '+254 51 221 0999', lat: -0.303, lng: 36.080, city: 'Nakuru'   },
    { name: 'Eldoret Fire Department',    phone: '+254 53 203 3001', lat:  0.521, lng: 35.269, city: 'Eldoret'  },
  ],
  accident: [
    { name: 'Kenyatta National Hospital', phone: '+254 20 272 6300', lat: -1.301, lng: 36.807, city: 'Nairobi'  },
    { name: 'Coast General Hospital',     phone: '+254 41 231 4201', lat: -4.062, lng: 39.659, city: 'Mombasa'  },
    { name: 'Jaramogi Oginga Hospital',   phone: '+254 57 202 0413', lat: -0.102, lng: 34.762, city: 'Kisumu'   },
    { name: 'Nakuru PGH',                phone: '+254 51 221 0560', lat: -0.287, lng: 36.071, city: 'Nakuru'   },
    { name: 'Moi Teaching & Referral',   phone: '+254 53 203 3471', lat:  0.518, lng: 35.282, city: 'Eldoret'  },
  ],
  violence: [
    { name: 'Changamwe Police Station',  phone: '+254 41 343 0101', lat: -4.052, lng: 39.621, city: 'Mombasa'  },
    { name: 'Central Police Station NBI',phone: '+254 20 222 2222', lat: -1.286, lng: 36.821, city: 'Nairobi'  },
    { name: 'Kisumu Central Police',     phone: '+254 57 202 0222', lat: -0.097, lng: 34.771, city: 'Kisumu'   },
    { name: 'Nakuru Police Station',     phone: '+254 51 221 0111', lat: -0.299, lng: 36.083, city: 'Nakuru'   },
    { name: 'Eldoret Police Station',    phone: '+254 53 203 1234', lat:  0.524, lng: 35.273, city: 'Eldoret'  },
  ],
  flood: [
    { name: 'Kenya Red Cross — Nairobi', phone: '+254 20 395 0000', lat: -1.291, lng: 36.820, city: 'Nairobi'  },
    { name: 'Kenya Red Cross — Mombasa', phone: '+254 41 222 0000', lat: -4.043, lng: 39.668, city: 'Mombasa'  },
    { name: 'County DRM Office Kisumu',  phone: '+254 57 202 5000', lat: -0.105, lng: 34.760, city: 'Kisumu'   },
    { name: 'NDOC Nakuru',              phone: '+254 51 221 7000', lat: -0.311, lng: 36.078, city: 'Nakuru'   },
    { name: 'Eldoret DRM Centre',       phone: '+254 53 203 5500', lat:  0.515, lng: 35.278, city: 'Eldoret'  },
  ],
  medical: [
    { name: 'Kenyatta National Hospital',phone: '+254 20 272 6300', lat: -1.301, lng: 36.807, city: 'Nairobi'  },
    { name: 'Aga Khan Hospital NBI',     phone: '+254 20 366 2000', lat: -1.261, lng: 36.808, city: 'Nairobi'  },
    { name: 'MP Shah Hospital',         phone: '+254 20 374 2763', lat: -1.269, lng: 36.810, city: 'Nairobi'  },
    { name: 'Coast General Hospital',    phone: '+254 41 231 4201', lat: -4.062, lng: 39.659, city: 'Mombasa'  },
    { name: 'Moi Teaching & Referral',  phone: '+254 53 203 3471', lat:  0.518, lng: 35.282, city: 'Eldoret'  },
  ],
  helpline: [
    { name: 'Kenya Emergency (Police)',  phone: '999',              lat: -1.286, lng: 36.821, city: 'National'  },
    { name: 'Ambulance / Fire',          phone: '999',              lat: -1.286, lng: 36.821, city: 'National'  },
    { name: 'Kenya Red Cross',           phone: '1199',             lat: -1.291, lng: 36.820, city: 'National'  },
    { name: 'Befrienders Kenya',         phone: '+254 722 178 177', lat: -1.295, lng: 36.815, city: 'Nairobi'  },
    { name: 'Gender Violence Helpline',  phone: '1195',             lat: -1.290, lng: 36.818, city: 'National'  },
  ],
}

const DISASTER_TYPES = [
  { key: 'fire',      label: 'Fire',             emoji: '🔥', color: '#E24B4A', desc: 'Building fire, wildfire, vehicle fire',      resource: 'Fire station'    },
  { key: 'accident',  label: 'Road accident',    emoji: '🚗', color: '#EF9F27', desc: 'Vehicle crash, collision, pile-up',           resource: 'Hospital'        },
  { key: 'violence',  label: 'Violence / crime', emoji: '🚔', color: '#9B59B6', desc: 'Assault, robbery, armed threat, unrest',      resource: 'Police station'  },
  { key: 'flood',     label: 'Flood / disaster', emoji: '🌊', color: '#378ADD', desc: 'Flooding, landslide, building collapse',      resource: 'Disaster relief' },
  { key: 'medical',   label: 'Medical emergency',emoji: '🏥', color: '#1D9E75', desc: 'Heart attack, unconscious, serious injury',   resource: 'Hospital'        },
  { key: 'helpline',  label: 'Helpline / crisis',emoji: '📞', color: '#DDB929', desc: 'Mental health, GBV, child safety, suicide',  resource: 'Helpline centre' },
]

// ── Haversine distance in km ───────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R  = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a  = Math.sin(dLat / 2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ── ETA estimate (40 km/h average urban) ──────────────────────────────────
function eta(km) {
  const mins = Math.ceil((km / 40) * 60)
  if (mins < 2) return '< 2 min'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ── SVG mini-map ──────────────────────────────────────────────────────────
function MiniMap({ userLat, userLng, resource, disasterType }) {
  // Project lat/lng into a 320×200 viewport centred on the midpoint
  const midLat = (userLat + resource.lat) / 2
  const midLng = (userLng + resource.lng) / 2
  const span   = Math.max(Math.abs(resource.lat - userLat), Math.abs(resource.lng - userLng)) * 1.6 + 0.08

  function proj(lat, lng) {
    const x = ((lng - midLng) / span + 0.5) * 300 + 10
    const y = ((midLat - lat) / span + 0.5) * 180 + 10
    return { x, y }
  }

  const user = proj(userLat, userLng)
  const res  = proj(resource.lat, resource.lng)
  const dist = haversine(userLat, userLng, resource.lat, resource.lng).toFixed(1)
  const color = DISASTER_TYPES.find(d => d.key === disasterType)?.color ?? '#E24B4A'

  // Mid-point for distance label
  const mx = (user.x + res.x) / 2
  const my = (user.y + res.y) / 2

  return (
    <svg viewBox="0 0 320 200" className="w-full rounded-xl border border-gray-700" style={{ background: '#0d1117' }}>
      {/* Grid */}
      {[60,120,180,240].map(x => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={200} stroke="#1f2937" strokeWidth="0.5"/>)}
      {[50,100,150].map(y  => <line key={`h${y}`} x1={0} y1={y} x2={320} y2={y}   stroke="#1f2937" strokeWidth="0.5"/>)}

      {/* Route dashed line */}
      <line
        x1={user.x} y1={user.y} x2={res.x} y2={res.y}
        stroke={color} strokeWidth="2" strokeDasharray="6 4" opacity="0.7"
      />

      {/* Distance badge on route */}
      <rect x={mx - 22} y={my - 9} width="44" height="18" rx="5" fill="#1f2937" stroke={color} strokeWidth="0.5" opacity="0.9"/>
      <text x={mx} y={my + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="9" fontWeight="600" fontFamily="monospace">
        {dist} km
      </text>

      {/* User dot (blue pulse) */}
      <circle cx={user.x} cy={user.y} r="10" fill="#3b82f6" opacity="0.15"/>
      <circle cx={user.x} cy={user.y} r="6"  fill="#3b82f6" opacity="0.9"/>
      <circle cx={user.x} cy={user.y} r="2"  fill="white"/>
      <text x={user.x} y={user.y + 18} textAnchor="middle" fill="#93c5fd" fontSize="8" fontFamily="sans-serif">You</text>

      {/* Resource dot */}
      <circle cx={res.x} cy={res.y} r="12" fill={color} opacity="0.15"/>
      <circle cx={res.x} cy={res.y} r="7"  fill={color} opacity="0.9"/>
      <circle cx={res.x} cy={res.y} r="2.5" fill="white"/>
      <text x={res.x} y={res.y - 16} textAnchor="middle" fill={color} fontSize="8" fontFamily="sans-serif" fontWeight="600">
        {resource.name.split(' ').slice(0, 2).join(' ')}
      </text>

      {/* ETA badge bottom-right */}
      <rect x="230" y="174" width="82" height="20" rx="5" fill="#1f2937" stroke="#374151" strokeWidth="0.5"/>
      <text x="271" y="184" textAnchor="middle" dominantBaseline="middle" fill="#e5e7eb" fontSize="9" fontFamily="sans-serif">
        ETA ≈ {eta(parseFloat(dist))}
      </text>
    </svg>
  )
}

// ── Resource card ─────────────────────────────────────────────────────────
function ResourceCard({ resource, userLat, userLng, disasterType, rank, onZoom }) {
  const dist  = haversine(userLat, userLng, resource.lat, resource.lng)
  const color = DISASTER_TYPES.find(d => d.key === disasterType)?.color ?? '#E24B4A'
  const mins  = Math.ceil((dist / 40) * 60)

  return (
    <div
      className={`rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.01]
        ${rank === 0 ? 'border-opacity-60' : 'border-gray-800 bg-gray-900/60'}`}
      style={rank === 0 ? { borderColor: color + '99', background: color + '08' } : {}}
      onClick={() => onZoom(resource)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {rank === 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: color }}>
              NEAREST
            </span>
          )}
          <span className="text-xs text-gray-500">#{rank + 1}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold" style={{ color: rank === 0 ? color : '#e5e7eb' }}>
            {dist.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500">≈ {eta(dist)}</div>
        </div>
      </div>

      <div className="text-sm font-semibold text-gray-100 mb-0.5">{resource.name}</div>
      <div className="text-xs text-gray-500 mb-3">{resource.city}</div>

      {/* Distance bar */}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, 100 - (dist / 50) * 80)}%`, background: color }} />
      </div>

      <div className="flex gap-2">
        <a
          href={`tel:${resource.phone}`}
          onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold
                     border transition-colors"
          style={{ borderColor: color + '60', color, background: color + '12' }}
        >
          📞 {resource.phone}
        </a>
        <button
          onClick={e => { e.stopPropagation(); onZoom(resource) }}
          className="px-3 py-2 rounded-lg text-xs border border-gray-700 text-gray-400
                     hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          🗺 Zoom
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Responder() {
  const navigate  = useNavigate()
  const [selected, setSelected]       = useState(null)        // disaster type key
  const [gps,      setGps]            = useState(null)        // { lat, lng }
  const [gpsError, setGpsError]       = useState(null)
  const [gpsLoading, setGpsLoading]   = useState(false)
  const [zoomed,   setZoomed]         = useState(null)        // resource being zoomed
  const [sorted,   setSorted]         = useState([])

  // Get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      err => {
        // Fallback: centre of Kenya
        setGps({ lat: -0.5, lng: 37.9 })
        setGpsError('GPS unavailable — using approximate Kenya centre. For precise routing, allow location access.')
        setGpsLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  // Sort resources by distance whenever disaster type or GPS changes
  useEffect(() => {
    if (!selected || !gps) return
    const list = RESOURCES[selected] ?? []
    const withDist = list.map(r => ({
      ...r,
      dist: haversine(gps.lat, gps.lng, r.lat, r.lng),
    }))
    withDist.sort((a, b) => a.dist - b.dist)
    setSorted(withDist)
    setZoomed(withDist[0] ?? null)   // auto-zoom to nearest
  }, [selected, gps])

  const disasterInfo = DISASTER_TYPES.find(d => d.key === selected)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-300 text-lg transition-colors">
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-100">🚨 Emergency responder</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Select your emergency type — we'll find the nearest resource with GPS routing and ETA.
          </p>
        </div>
      </div>

      {/* ── GPS status bar ── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
        gpsLoading
          ? 'border-blue-800 bg-blue-950/30 text-blue-400'
          : gpsError
          ? 'border-amber-800 bg-amber-950/30 text-amber-400'
          : 'border-emerald-800 bg-emerald-950/30 text-emerald-400'
      }`}>
        {gpsLoading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"/>}
        {!gpsLoading && <span className="text-lg shrink-0">{gpsError ? '⚠' : '📍'}</span>}
        <div className="flex-1">
          {gpsLoading && 'Acquiring GPS location…'}
          {!gpsLoading && gpsError  && gpsError}
          {!gpsLoading && !gpsError && gps &&
            `GPS locked — ${gps.lat.toFixed(4)}°, ${gps.lng.toFixed(4)}° · All distances calculated from your location`}
        </div>
        {!gpsLoading && gps && (
          <span className="text-xs opacity-60 shrink-0">
            {gpsError ? 'Approximate' : 'High accuracy'}
          </span>
        )}
      </div>

      {/* ── Disaster type selector ── */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Select your emergency type
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DISASTER_TYPES.map(d => (
            <button
              key={d.key}
              onClick={() => { setSelected(d.key); setZoomed(null) }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                selected === d.key
                  ? 'scale-[1.02]'
                  : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/60'
              }`}
              style={selected === d.key
                ? { borderColor: d.color + '80', background: d.color + '10' }
                : {}}
            >
              <span className="text-2xl shrink-0 mt-0.5">{d.emoji}</span>
              <div>
                <div className="text-sm font-semibold mb-0.5"
                  style={{ color: selected === d.key ? d.color : '#e5e7eb' }}>
                  {d.label}
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{d.desc}</div>
                <div className="text-[10px] mt-1.5 font-medium"
                  style={{ color: selected === d.key ? d.color : '#6b7280' }}>
                  → {d.resource}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Results: map + cards ── */}
      {selected && gps && sorted.length > 0 && (
        <div className="grid grid-cols-5 gap-5">

          {/* Left — resource list (2 cols) */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {disasterInfo?.emoji} Nearest {disasterInfo?.resource}s
              </div>
              <div className="text-xs text-gray-600">{sorted.length} found</div>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {sorted.map((r, i) => (
                <ResourceCard
                  key={r.name}
                  resource={r}
                  userLat={gps.lat}
                  userLng={gps.lng}
                  disasterType={selected}
                  rank={i}
                  onZoom={res => setZoomed(res)}
                />
              ))}
            </div>
          </div>

          {/* Right — map + details (3 cols) */}
          <div className="col-span-3 space-y-4">

            {/* Map */}
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  📍 Route map {zoomed ? `→ ${zoomed.name}` : ''}
                </div>
                {zoomed && (
                  <div className="text-xs text-gray-600">
                    {haversine(gps.lat, gps.lng, zoomed.lat, zoomed.lng).toFixed(1)} km ·
                    ≈ {eta(haversine(gps.lat, gps.lng, zoomed.lat, zoomed.lng))}
                  </div>
                )}
              </div>
              {zoomed
                ? <MiniMap userLat={gps.lat} userLng={gps.lng} resource={zoomed} disasterType={selected} />
                : <div className="h-48 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-600 text-sm">
                    Click a resource to view route
                  </div>
              }
            </div>

            {/* Zoomed resource detail panel */}
            {zoomed && (() => {
              const dist  = haversine(gps.lat, gps.lng, zoomed.lat, zoomed.lng)
              const color = disasterInfo?.color ?? '#E24B4A'
              const mins  = Math.ceil((dist / 40) * 60)
              return (
                <div className="card space-y-4" style={{ borderColor: color + '40' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-100">{zoomed.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{zoomed.city}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
                      style={{ background: color }}>
                      {disasterInfo?.resource?.toUpperCase()}
                    </span>
                  </div>

                  {/* Distance / ETA / GPS stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { icon: '📏', label: 'Distance', value: `${dist.toFixed(2)} km` },
                      { icon: '⏱',  label: 'Est. ETA', value: eta(dist)              },
                      { icon: '🚗',  label: 'Avg speed', value: '40 km/h'            },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-800 rounded-xl py-3 px-2 border border-gray-700">
                        <div className="text-lg mb-1">{s.icon}</div>
                        <div className="text-sm font-bold text-gray-100">{s.value}</div>
                        <div className="text-[10px] text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* GPS coords */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-gray-600 mb-0.5">Your GPS</div>
                      <div className="font-mono text-gray-300">
                        {gps.lat.toFixed(4)}°, {gps.lng.toFixed(4)}°
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-gray-600 mb-0.5">Resource GPS</div>
                      <div className="font-mono text-gray-300">
                        {zoomed.lat.toFixed(4)}°, {zoomed.lng.toFixed(4)}°
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <a
                      href={`tel:${zoomed.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                                 text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: color }}
                    >
                      📞 Call now — {zoomed.phone}
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${gps.lat},${gps.lng}&destination=${zoomed.lat},${zoomed.lng}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-3 rounded-xl border border-gray-700 text-gray-400
                                 hover:bg-gray-800 hover:text-gray-200 transition-colors text-sm flex items-center gap-1.5"
                    >
                      🗺 Google Maps
                    </a>
                  </div>

                  {/* Route breakdown */}
                  <div className="text-xs text-gray-600 bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-800">
                    <span className="text-gray-500 font-semibold">Route note: </span>
                    Straight-line distance of {dist.toFixed(2)} km calculated via Haversine formula.
                    Real road distance may be {(dist * 1.3).toFixed(1)}–{(dist * 1.6).toFixed(1)} km.
                    ETA assumes 40 km/h average urban speed. Use Google Maps button for turn-by-turn directions.
                  </div>
                </div>
              )
            })()}

            {/* Quick helpline strip */}
            <div className="card">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                📞 Kenya national helplines
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Police / Fire / Ambulance', number: '999',  color: '#E24B4A' },
                  { label: 'Kenya Red Cross',           number: '1199', color: '#E24B4A' },
                  { label: 'Gender violence',           number: '1195', color: '#9B59B6' },
                ].map(h => (
                  <a key={h.number} href={`tel:${h.number}`}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-800
                               bg-gray-800/40 hover:bg-gray-800 transition-colors text-center">
                    <div className="text-xl font-bold mb-0.5" style={{ color: h.color }}>{h.number}</div>
                    <div className="text-[10px] text-gray-500 leading-tight">{h.label}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!selected && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🚨</div>
          <div className="text-base font-semibold text-gray-400 mb-2">Select an emergency type above</div>
          <div className="text-sm text-gray-600">
            We'll instantly find the nearest fire station, hospital, police post or helpline —
            sorted by GPS distance with estimated arrival time.
          </div>
        </div>
      )}

    </div>
  )
}
