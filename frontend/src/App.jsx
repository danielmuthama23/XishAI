import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar  from './components/Navbar'
import Dashboard    from './pages/Dashboard'
import MapPage      from './pages/Map'
import ReportForm   from './pages/ReportForm'
import AIAssistant  from './pages/AIAssistant'
import Predictions  from './pages/Predictions'
import BlockchainLog from './pages/BlockchainLog'
import Landing      from './pages/Landing'
import Responder    from './pages/Responder'

// Pages that render fullscreen (no sidebar/navbar shell)
const FULLSCREEN = ['/', '/landing']

export default function App() {
  return (
    <Routes>
      {/* ── Fullscreen pages (own layout) ── */}
      <Route path="/"        element={<Landing />} />
      <Route path="/landing" element={<Landing />} />

      {/* ── App shell pages ── */}
      <Route path="/*" element={
        <div className="flex h-screen overflow-hidden bg-gray-950">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-5">
              <Routes>
                <Route path="/dashboard"   element={<Dashboard />} />
                <Route path="/map"         element={<MapPage />} />
                <Route path="/report"      element={<ReportForm />} />
                <Route path="/ai"          element={<AIAssistant />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/blockchain"  element={<BlockchainLog />} />
                <Route path="/responder"   element={<Responder />} />
                <Route path="*"            element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      } />
    </Routes>
  )
}
