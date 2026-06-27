import { useState, useEffect } from 'react'
import { api } from '../services/api'

const CITIES = ['Kisumu', 'Mombasa', 'Nairobi', 'Nakuru', 'Eldoret']

// Fallback static predictions (used when API is unavailable)
const FALLBACK = {
  Kisumu:  { flood_probability: 0.82, fire_probability: 0.12, security_risk: 0.28, model_confidence: 0.79 },
  Mombasa: { flood_probability: 0.45, fire_probability: 0.67, security_risk: 0.74, model_confidence: 0.84 },
  Nairobi: { flood_probability: 0.61, fire_probability: 0.34, security_risk: 0.55, model_confidence: 0.88 },
  Nakuru:  { flood_probability: 0.30, fire_probability: 0.22, security_risk: 0.38, model_confidence: 0.76 },
  Eldoret: { flood_probability: 0.18, fire_probability: 0.15, security_risk: 0.24, model_confidence: 0.72 },
}

function riskColor(v) {
  if (v >= 0.7) return '#E24B4A'
  if (v >= 0.5) return '#EF9F27'
  if (v >= 0.3) return '#DDB929'
  return '#4ade80'
}

function RiskBar({ label, value }) {
  const pct  = Math.round(value * 100)
  const col  = riskColor(value)
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: col }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color: col }}>{pct}%</span>
    </div>
  )
}

export default function Predictions() {
  const [predictions, setPredictions] = useState(FALLBACK)
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState('Kisumu')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = {}
      for (const city of CITIES) {
        try {
          results[city] = await api.getCityPrediction(city)
        } catch {
          results[city] = FALLBACK[city]
        }
      }
      setPredictions(results)
      setLoading(false)
    }
    load()
  }, [])

  const top = predictions[selected] ?? FALLBACK[selected]

  return (
    <div className="space-y-5">
      {/* Alert for highest-risk city */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-800 rounded-xl">
        <span className="text-xl">🌊</span>
        <div className="flex-1 text-sm">
          <strong className="text-amber-400">High flood risk tomorrow</strong>
          <span className="text-gray-400"> — Kisumu at {Math.round((predictions.Kisumu?.flood_probability ?? 0.82) * 100)}% probability. Based on weather + historical data.</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* All cities forecast */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            24-hour risk forecast
          </div>
          {loading ? (
            <div className="text-sm text-gray-600 animate-pulse py-4">Loading predictions…</div>
          ) : (
            <div className="space-y-5">
              {CITIES.map(city => {
                const p = predictions[city] ?? FALLBACK[city]
                return (
                  <div key={city}
                    className={`cursor-pointer transition-colors ${selected === city ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
                    onClick={() => setSelected(city)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-medium ${selected === city ? 'text-blue-400' : 'text-gray-200'}`}>
                        {city}
                      </span>
                      <span className="text-xs text-gray-600">
                        Confidence {Math.round((p.model_confidence ?? 0.8) * 100)}%
                      </span>
                    </div>
                    <RiskBar label="Flood"    value={p.flood_probability} />
                    <RiskBar label="Fire"     value={p.fire_probability}  />
                    <RiskBar label="Security" value={p.security_risk}     />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* City detail */}
          <div className="card border-blue-800">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {selected} — detail
            </div>
            {[
              { label: 'Flood probability', value: top.flood_probability, icon: '🌊' },
              { label: 'Fire probability',  value: top.fire_probability,  icon: '🔥' },
              { label: 'Security risk',     value: top.security_risk,     icon: '🔒' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(r.value * 100)}%`, background: riskColor(r.value) }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: riskColor(r.value) }}>
                      {Math.round(r.value * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Model info */}
          <div className="card">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Azure ML model
            </div>
            {[
              ['Algorithm',   'LSTM + XGBoost ensemble'],
              ['Training',    '5 years, 14 cities'],
              ['Accuracy',    '87.4%'],
              ['Last trained','6 hours ago'],
              ['Inputs',      'Weather, crime, social, history'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1.5 border-b border-gray-800 last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-300">{v}</span>
              </div>
            ))}
          </div>

          {/* Model inputs */}
          <div className="card">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Data inputs
            </div>
            {[
              { icon: '📅', label: 'Historical incidents', val: '2,847 records' },
              { icon: '🌧', label: 'Weather data',         val: 'Live + 7-day' },
              { icon: '💬', label: 'Social sentiment',     val: 'X/Twitter feed' },
              { icon: '🚔', label: 'Crime reports',        val: 'Police (30d)' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                <span>{f.icon}</span>
                <span className="text-xs text-gray-400 flex-1">{f.label}</span>
                <span className="text-xs text-gray-600">{f.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
