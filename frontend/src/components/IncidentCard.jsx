import SeverityBadge from './SeverityBadge'

export default function IncidentCard({ incident, compact = false }) {
  const { id, type, area, city, severity, status, verified, responders, time } = incident

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
        <span className="text-lg">
          {type === 'Fire' ? '🔴'
            : type === 'Flood' ? '🔵'
            : type === 'Medical' ? '🟢'
            : type === 'Accident' ? '🟠'
            : '🟡'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-100 truncate">{type} — {area}</div>
          <div className="text-xs text-gray-500">{city} · {time}</div>
        </div>
        <SeverityBadge score={severity} showScore={false} />
      </div>
    )
  }

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold text-gray-100">{type}</div>
          <div className="text-xs text-gray-500 mt-0.5">📍 {area}, {city}</div>
        </div>
        <span className="text-xs text-gray-600 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 font-mono shrink-0">
          {id}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SeverityBadge score={severity} />
        {verified && (
          <span className="sev-badge bg-emerald-900/40 text-emerald-400 border border-emerald-800">
            ✓ Verified
          </span>
        )}
        <span className="text-xs text-gray-600 ml-auto">{status}</span>
      </div>

      {responders && responders.length > 0 && (
        <div className="text-xs text-gray-500">
          🚒 {Array.isArray(responders) ? responders.join(', ') : responders}
        </div>
      )}
    </div>
  )
}
