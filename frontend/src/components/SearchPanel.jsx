import { useState } from 'react'
import { api } from '../services/api'
import SeverityBadge from './SeverityBadge'

export default function SearchPanel() {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.searchIncidents(query)
      setResults(data)
    } catch (err) {
      setError('Search failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        🔍 Search incidents
      </div>

      <form onSubmit={search} className="flex gap-2 mb-3">
        <input
          className="form-input flex-1"
          placeholder="e.g. floods near schools"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary py-2 px-3 text-xs" disabled={loading}>
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">{r.type} — {r.area}, {r.city}</div>
                <div className="text-xs text-gray-600">{r.status} · {r.timestamp?.slice(0, 10)}</div>
              </div>
              <SeverityBadge score={r.severity} showScore={false} />
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <p className="text-xs text-gray-600">No results found.</p>
      )}
    </div>
  )
}
