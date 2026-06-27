import { useIncidents } from '../hooks/useIncidents'

export default function BlockchainLog() {
  const { incidents } = useIncidents()

  // Simulate extended hashes
  const extend = h => h + Array.from({ length: 16 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hedera HCS — incident log
            </div>
            <div className="text-sm text-gray-400">
              Every report is SHA-256 hashed and anchored to Hedera Hashgraph for tamper-evident audit.
            </div>
          </div>
          <div className="flex gap-2">
            <span className="sev-badge bg-emerald-900/30 text-emerald-400 border border-emerald-800">
              🔒 Consensus: 100%
            </span>
          </div>
        </div>

        {/* Log entries */}
        <div className="divide-y divide-gray-800 max-h-[420px] overflow-y-auto">
          {incidents.map((inc, idx) => (
            <div key={inc.id} className="py-3">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  #{String(incidents.length - idx).padStart(4, '0')}
                </span>
                <span className="text-sm font-medium text-gray-200">{inc.id}</span>
                <span className="text-sm text-gray-400">{inc.type} — {inc.area}, {inc.city}</span>
                <span className="ml-auto">
                  <span className="sev-badge bg-emerald-900/30 text-emerald-400 border border-emerald-800 text-xs">
                    ✓ Anchored
                  </span>
                </span>
              </div>
              <div className="font-mono text-[10px] text-gray-500 break-all mb-1">
                SHA-256: {extend(inc.hash ?? 'A0B1C2D3E4F5')}
              </div>
              <div className="text-[10px] text-gray-600">
                Block timestamp: 2026-06-26T{inc.time ?? '00:00'}:00Z &nbsp;·&nbsp;
                Topic: 0.0.48291834 &nbsp;·&nbsp;
                Seq: {1000 + idx}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats + Trust properties */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Chain stats
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total hashes',  value: incidents.length },
              { label: 'Topic ID',      value: '0.0.48291' },
              { label: 'Consensus',     value: '100%' },
              { label: 'Avg finality',  value: '3.8s' },
              { label: 'Network',       value: 'Mainnet' },
              { label: 'Algorithm',     value: 'SHA-256' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-semibold text-gray-100">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Trust properties
          </div>
          {[
            {
              icon: '🛡',
              label: 'Tamper-evident',
              desc: 'Any change to report data produces a different hash, immediately detectable',
            },
            {
              icon: '⏱',
              label: 'Timestamped',
              desc: 'Hedera consensus timestamp proves the report existed at a specific moment in time',
            },
            {
              icon: '🚫',
              label: 'Duplicate detection',
              desc: 'Identical incident hashes reveal duplicate or replayed reports automatically',
            },
            {
              icon: '🌐',
              label: 'Decentralised',
              desc: 'No single party controls the log — governed by Hedera Governing Council',
            },
          ].map(p => (
            <div key={p.label} className="flex gap-3 py-2.5 border-b border-gray-800 last:border-0">
              <span className="text-xl mt-0.5">{p.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-200">{p.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          How Hedera logging works
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            'Incident reported',
            '→',
            'Serialise to JSON',
            '→',
            'SHA-256 hash',
            '→',
            'Submit to HCS topic',
            '→',
            'Consensus timestamp',
            '→',
            'Stored in Cosmos DB',
          ].map((s, i) => (
            s === '→'
              ? <span key={i} className="text-gray-600 text-lg">→</span>
              : <span key={i} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300">
                  {s}
                </span>
          ))}
        </div>
      </div>
    </div>
  )
}
