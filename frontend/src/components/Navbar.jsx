import { useLocation, Link } from 'react-router-dom'

const TITLES = {
  '/dashboard':   'Dashboard',
  '/map':         'Live map',
  '/report':      'Report incident',
  '/ai':          'AI assistant',
  '/predictions': 'Predictions',
  '/blockchain':  'Blockchain log',
  '/responder':   '🚨 Emergency responder',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'CivicAI'

  return (
    <header className="h-13 min-h-[52px] bg-gray-900 border-b border-gray-800 flex items-center px-5 gap-3">
      <h1 className="flex-1 text-base font-semibold text-gray-100">{title}</h1>

      <span className="sev-badge bg-red-900/50 text-red-400 border border-red-800">
        ⚠ 3 critical
      </span>
      <span className="sev-badge bg-amber-900/40 text-amber-400 border border-amber-800">
        7 active
      </span>

      <Link to="/responder">
        <button className="btn btn-danger text-xs py-1 px-3">
          🚨 Help
        </button>
      </Link>

      <Link to="/report">
        <button className="btn btn-danger text-xs py-1 px-3">
          + Report
        </button>
      </Link>
    </header>
  )
}
