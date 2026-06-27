/**
 * SeverityBadge — renders a coloured pill for a 1-10 severity score.
 */

const CONFIG = {
  Critical: { bg: 'bg-red-900/50',    text: 'text-red-400',    border: 'border-red-800',    dot: 'bg-red-400'    },
  Serious:  { bg: 'bg-orange-900/40', text: 'text-orange-400', border: 'border-orange-800', dot: 'bg-orange-400' },
  Moderate: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', border: 'border-yellow-800', dot: 'bg-yellow-400' },
  Minor:    { bg: 'bg-blue-900/40',   text: 'text-blue-400',   border: 'border-blue-800',   dot: 'bg-blue-400'   },
  Info:     { bg: 'bg-gray-800',      text: 'text-gray-400',   border: 'border-gray-700',   dot: 'bg-gray-400'   },
}

export function severityLabel(score) {
  if (score >= 9) return 'Critical'
  if (score >= 7) return 'Serious'
  if (score >= 5) return 'Moderate'
  if (score >= 3) return 'Minor'
  return 'Info'
}

export function severityColor(score) {
  const map = { Critical: '#E24B4A', Serious: '#EF9F27', Moderate: '#DDB929', Minor: '#378ADD', Info: '#888780' }
  return map[severityLabel(score)] ?? '#888780'
}

export default function SeverityBadge({ score, showScore = true }) {
  const label = severityLabel(score)
  const c     = CONFIG[label]

  return (
    <span className={`sev-badge border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {showScore && <span>{score}/10</span>}
      <span>{label}</span>
    </span>
  )
}
