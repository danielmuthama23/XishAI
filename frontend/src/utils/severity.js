/**
 * utils/severity.js
 * ─────────────────
 * Mirror of backend utils/severity.py for client-side use.
 */

export const SEVERITY_LEVELS = [
  { range: [9, 10], label: 'Critical', color: '#E24B4A', bg: 'bg-red-900/50',    text: 'text-red-400'    },
  { range: [7, 8],  label: 'Serious',  color: '#EF9F27', bg: 'bg-orange-900/40', text: 'text-orange-400' },
  { range: [5, 6],  label: 'Moderate', color: '#DDB929', bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  { range: [3, 4],  label: 'Minor',    color: '#378ADD', bg: 'bg-blue-900/40',   text: 'text-blue-400'   },
  { range: [1, 2],  label: 'Info',     color: '#888780', bg: 'bg-gray-800',      text: 'text-gray-400'   },
]

export function getSeverityLevel(score) {
  return SEVERITY_LEVELS.find(l => score >= l.range[0] && score <= l.range[1]) ?? SEVERITY_LEVELS[4]
}

export function severityLabel(score)  { return getSeverityLevel(score).label }
export function severityColor(score)  { return getSeverityLevel(score).color }

export function incidentEmoji(type) {
  const map = {
    'Fire':              '🔴',
    'Flood':             '🔵',
    'Medical':           '🟢',
    'Medical emergency': '🟢',
    'Accident':          '🟠',
    'Security':          '🟡',
    'Building collapse': '🔴',
    'Power outage':      '⚪',
  }
  return map[type] ?? '⚫'
}
