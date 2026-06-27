import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'

const QUICK = [
  'Fires in last 24h',
  'Highest severity areas',
  'Resource gaps',
  'Flood risk tomorrow',
]

export default function AIPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I have access to all active incidents. Ask me about severity trends, resource needs, or area-specific risks.' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const q = text ?? input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const { answer } = await api.ragQuery({ question: q })
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠ Connection error. Is the backend running?' }])
    }
    setLoading(false)
  }

  return (
    <div className="card flex flex-col h-full min-h-[360px]">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        🤖 AI assistant (RAG + GPT-4o)
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-900/30 text-gray-100 ml-8'
                : 'bg-gray-800 border border-gray-700 text-gray-200 mr-8'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-500 mr-8 animate-pulse">
            Searching incidents…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {QUICK.map(q => (
          <button key={q} className="btn btn-ghost text-xs py-1 px-2" onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="form-input flex-1"
          placeholder="Ask about incidents…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button className="btn btn-primary px-3" onClick={() => send()} disabled={loading}>
          ➤
        </button>
      </div>
    </div>
  )
}
