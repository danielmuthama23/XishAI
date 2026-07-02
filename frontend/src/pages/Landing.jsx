import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const STATS = [
  { value: '< 8 min', label: 'Avg. response time' },
  { value: '99.4%',   label: 'Uptime SLA' },
  { value: '5 cities', label: 'Coverage' },
  { value: 'Real-time', label: 'AI analysis' },
]

const FEATURES = [
  {
    icon: '🗺',
    title: 'Live incident map',
    desc: 'Real-time markers with severity colours, GPS routing and animated pulse rings for every active incident across Kenya.',
    to: '/map',
  },
  {
    icon: '🤖',
    title: 'AI assistant',
    desc: 'GPT-4o grounded on live incident data via RAG. Ask anything — severity trends, resource gaps, flood predictions.',
    to: '/ai',
  },
  {
    icon: '🚨',
    title: 'Emergency responder',
    desc: 'Select your disaster type. Instantly surface the nearest fire station, hospital, police post or helpline with GPS distance and ETA.',
    to: '/responder',
    highlight: true,
  },
  {
    icon: '⚠',
    title: 'Report an incident',
    desc: 'Photo + voice + GPS. YOLOv11 → CLIP → SAM → GPT-4o pipeline scores severity and notifies authorities in seconds.',
    to: '/report',
  },
  {
    icon: '📈',
    title: 'Risk predictions',
    desc: 'Azure ML 24-hour flood, fire and security forecasts for every city — powered by weather, crime and social-sentiment data.',
    to: '/predictions',
  },
  {
    icon: '🔗',
    title: 'Blockchain audit log',
    desc: 'Every report is SHA-256 hashed and anchored to Hedera Hashgraph — tamper-evident, timestamped, publicly verifiable.',
    to: '/blockchain',
  },
]

const TICKER = [
  '🔴 CRITICAL — Building collapse Eastleigh, Nairobi',
  '🟠 SERIOUS — Road accident CBD, Nakuru',
  '🔴 CRITICAL — Fire Changamwe, Mombasa',
  '🔵 MINOR — Power outage Huruma, Eldoret',
  '🟡 MODERATE — Security alert Nyali, Mombasa',
]

export default function Landing() {
  const navigate = useNavigate()
  const [tickerIdx, setTickerIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setTickerIdx(i => (i + 1) % TICKER.length)
        setFade(true)
      }, 300)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">

      {/* ── Top nav bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4
                      bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🛡</span>
          <span className="text-base font-bold tracking-tight">CivicAI</span>
          <span className="text-xs text-gray-500 ml-1">Emergency Intelligence</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5">
            Dashboard
          </button>
          <button onClick={() => navigate('/map')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5">
            Live map
          </button>
          <button onClick={() => navigate('/responder')}
            className="text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
            🚨 Emergency help
          </button>
        </div>
      </nav>

      {/* ── Live incident ticker ── */}
      <div className="fixed top-[61px] left-0 right-0 z-40 bg-red-950/60 border-b border-red-900/50
                      backdrop-blur px-6 py-2 flex items-center gap-3">
        <span className="text-xs font-bold text-red-400 uppercase tracking-wider shrink-0">LIVE</span>
        <span className="w-px h-3 bg-red-800" />
        <span
          className="text-xs text-gray-300 transition-opacity duration-300"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {TICKER[tickerIdx]}
        </span>
        <button onClick={() => navigate('/map')}
          className="ml-auto text-xs text-red-400 hover:text-red-300 shrink-0">
          View all →
        </button>
      </div>

      {/* ── Hero ── */}
      <section className="pt-40 pb-24 px-8 text-center relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-red-600/8 blur-3xl" />
          <div className="absolute top-32 right-1/4 w-80 h-80 rounded-full bg-blue-600/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-emerald-600/5 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-700
                          bg-gray-900/60 text-xs text-gray-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-powered · Real-time · Blockchain-verified
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Faster emergency response
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">
              powered by AI
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CivicAI combines computer vision, GPT-4o reasoning, live GPS routing and Hedera blockchain
            logging to help Kenyan citizens report emergencies and connect with the right responders —
            in seconds.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/responder')}
              className="flex items-center gap-2 px-7 py-3.5 bg-red-600 hover:bg-red-500
                         text-white font-semibold rounded-xl text-base transition-all
                         shadow-lg shadow-red-900/40 hover:shadow-red-900/60 hover:scale-105"
            >
              🚨 Get emergency help
            </button>
            <button
              onClick={() => navigate('/report')}
              className="flex items-center gap-2 px-7 py-3.5 bg-gray-800 hover:bg-gray-700
                         border border-gray-700 text-gray-200 font-semibold rounded-xl text-base
                         transition-all hover:scale-105"
            >
              ⚠ Report an incident
            </button>
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-2 px-7 py-3.5 bg-transparent hover:bg-gray-800/50
                         border border-gray-700 text-gray-400 font-medium rounded-xl text-base
                         transition-all"
            >
              🗺 View live map
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-800 bg-gray-900/40 py-8 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything you need in a crisis</h2>
            <p className="text-gray-500">Six integrated modules — one platform.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <button
                key={f.to}
                onClick={() => navigate(f.to)}
                className={`text-left p-5 rounded-2xl border transition-all group hover:scale-[1.02]
                  ${f.highlight
                    ? 'border-red-700 bg-red-950/30 hover:bg-red-950/50 hover:border-red-500'
                    : 'border-gray-800 bg-gray-900/40 hover:bg-gray-800/60 hover:border-gray-600'
                  }`}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className={`font-semibold mb-2 text-sm ${f.highlight ? 'text-red-300' : 'text-gray-100'}`}>
                  {f.title}
                  {f.highlight && (
                    <span className="ml-2 text-[10px] bg-red-700 text-red-200 px-1.5 py-0.5 rounded font-normal">NEW</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                <div className={`mt-4 text-xs font-medium group-hover:translate-x-1 transition-transform inline-block
                  ${f.highlight ? 'text-red-400' : 'text-blue-400'}`}>
                  Open →
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-8 border-t border-gray-800 bg-gray-900/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How CivicAI responds to an emergency</h2>
          <div className="flex items-start gap-0">
            {[
              { icon: '📍', title: 'GPS detected', desc: 'Your location is captured automatically for precise routing' },
              { icon: '🔍', title: 'AI analyses', desc: 'YOLOv11 + CLIP + GPT-4o score severity in under 3 seconds' },
              { icon: '🚒', title: 'Nearest resource', desc: 'OSRM routing finds the closest fire station, hospital or police post' },
              { icon: '📲', title: 'Authorities notified', desc: 'SMS + Email sent instantly via Azure Communication Services' },
              { icon: '🔗', title: 'Blockchain logged', desc: 'Hedera hash anchors the report — tamper-proof and timestamped' },
            ].map((s, i, arr) => (
              <div key={s.title} className="flex-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl mb-3 relative z-10">
                  {s.icon}
                </div>
                {i < arr.length - 1 && (
                  <div className="absolute mt-6" style={{ marginLeft: '50%', width: 'calc(100% - 48px)', height: '1px', background: 'linear-gradient(90deg,#374151,#4B5563)', zIndex: 0 }} />
                )}
                <div className="text-sm font-semibold text-gray-200 mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="py-16 px-8 text-center border-t border-gray-800">
        <h2 className="text-2xl font-bold mb-4">Ready to respond?</h2>
        <p className="text-gray-500 mb-8 text-sm">Enter the dashboard or get emergency help now.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all">
            Open dashboard →
          </button>
          <button onClick={() => navigate('/responder')}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-all">
            🚨 Emergency help
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🛡</span>
          <span>CivicAI — Emergency Intelligence Platform</span>
        </div>
        <div className="text-xs text-gray-700">Kenya · React + FastAPI + Azure + Hedera</div>
      </footer>

    </div>
  )
}
