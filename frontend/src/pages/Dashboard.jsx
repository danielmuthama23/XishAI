import { Link } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import IncidentCard from '../components/IncidentCard'
import SeverityBadge from '../components/SeverityBadge'
import { severityColor } from '../utils/severity'

const CITY_STATS = [
  { city: 'Mombasa', security: 91, flood: 48, economic: 39 },
  { city: 'Nairobi', security: 74, flood: 62, economic: 55 },
  { city: 'Kisumu',  security: 58, flood: 81, economic: 44 },
  { city: 'Nakuru',  security: 67, flood: 35, economic: 29 },
  { city: 'Eldoret', security: 45, flood: 28, economic: 22 },
]

function RiskBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const { incidents, loading, error } = useIncidents()

  const critical = incidents.filter(i => i.severity >= 9)
  const active   = incidents.filter(i => ['Active', 'Critical'].includes(i.status))
  const verified = incidents.filter(i => i.verified)

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {critical.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-900/20 border border-red-800 rounded-xl">
          <span className="text-xl">⚠</span>
          <div className="flex-1 text-sm">
            <strong className="text-red-400">{critical.length} critical incident{critical.length > 1 ? 's' : ''}</strong>
            <span className="text-gray-400"> require immediate response — {critical.map(i => i.area).join(', ')}.</span>
          </div>
          <Link to="/map">
            <button className="btn btn-ghost text-xs py-1 px-3">View map</button>
          </Link>
        </div>
      )}

      {error && (
        <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2">
          ⚠ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active incidents', value: incidents.length, sub: 'Across 5 cities',         color: 'text-gray-100' },
          { label: 'Critical (9–10)',  value: critical.length,  sub: 'Immediate action needed',  color: 'text-red-400'  },
          { label: 'Verified',         value: verified.length,  sub: 'Crowd-confirmed',          color: 'text-emerald-400' },
          { label: 'Avg response',     value: '8 min',          sub: "Today's average",          color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-3xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Incident feed */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recent incidents
          </div>
          {loading ? (
            <div className="text-sm text-gray-600 animate-pulse py-4 text-center">Loading…</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-0 divide-y divide-gray-800">
              {incidents.map(i => (
                <div key={i.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: severityColor(i.severity) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-100 truncate">
                      {i.type} — {i.area}, {i.city}
                    </div>
                    <div className="text-xs text-gray-500">
                      {i.time} · Sev {i.severity}
                      {i.verified && (
                        <span className="ml-2 text-emerald-500">✓ Verified</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{i.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City risk index */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            City risk index
          </div>
          <div className="space-y-4">
            {CITY_STATS.map(c => (
              <div key={c.city}>
                <div className="text-sm font-medium text-gray-200 mb-1.5">{c.city}</div>
                <RiskBar label="Security" value={c.security} color="#E24B4A" />
                <RiskBar label="Flood"    value={c.flood}    color="#378ADD" />
                <RiskBar label="Economic" value={c.economic} color="#DDB929" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident cards grid */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Active incident cards
        </div>
        <div className="grid grid-cols-3 gap-3">
          {incidents.slice(0, 6).map(i => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
