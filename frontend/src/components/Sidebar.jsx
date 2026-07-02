import { NavLink } from 'react-router-dom'

const NAV = [
  { label: 'Monitor',  isSection: true },
  { to: '/dashboard',   label: 'Dashboard',      icon: '⊞' },
  { to: '/map',         label: 'Live map',        icon: '🗺' },
  { label: 'Response', isSection: true },
  { to: '/responder',   label: 'Emergency help',  icon: '🚨', highlight: true },
  { to: '/report',      label: 'Report incident', icon: '⚠' },
  { to: '/ai',          label: 'AI assistant',    icon: '🤖' },
  { label: 'Analysis', isSection: true },
  { to: '/predictions', label: 'Predictions',     icon: '📈' },
  { to: '/blockchain',  label: 'Blockchain log',  icon: '🔗' },
]

export default function Sidebar() {
  return (
    <aside className="w-52 min-w-[208px] bg-gray-900 border-r border-gray-800 flex flex-col py-4">
      {/* Logo */}
      <div className="px-4 pb-4 border-b border-gray-800 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡</span>
          <div>
            <div className="text-sm font-semibold text-white">CivicAI</div>
            <div className="text-xs text-gray-500">Emergency Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col">
        {NAV.map((item, i) =>
          item.isSection ? (
            <div key={i} className="px-4 pt-4 pb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
              {item.label}
            </div>
          ) : item.highlight ? (
            /* Emergency help — special red highlight */
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors mx-2 my-0.5 rounded-lg font-semibold ` +
                (isActive
                  ? 'bg-red-700 text-white'
                  : 'bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-800/40 hover:text-red-300')
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ` +
                (isActive
                  ? 'bg-blue-900/30 text-blue-400 font-medium border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50')
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* Status */}
      <div className="px-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500">System online</span>
        </div>
      </div>
    </aside>
  )
}
