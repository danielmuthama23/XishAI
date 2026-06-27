import { useRef, useEffect } from 'react'
import { useAI } from '../hooks/useAI'
import { useIncidents } from '../hooks/useIncidents'

const QUICK_PROMPTS = [
  'Which areas have the highest flood risk right now?',
  'List all fires with severity above 7',
  'What resources are needed in Mombasa?',
  'Show critical incidents in the last 24 hours',
  'What is the recommended response for Eastleigh?',
]

export default function AIAssistant() {
  const { messages, loading, sendMessage, clearHistory } = useAI()
  const { incidents } = useIncidents()
  const inputRef  = useRef()
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend() {
    const text = inputRef.current?.value?.trim()
    if (text) {
      sendMessage(text)
      inputRef.current.value = ''
    }
  }

  return (
    <div className="grid grid-cols-5 gap-5 h-[calc(100vh-130px)]">
      {/* Chat — 3 cols */}
      <div className="col-span-3 card flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            🤖 AI assistant — RAG + GPT-4o
          </div>
          <button className="text-xs text-gray-600 hover:text-gray-400" onClick={clearHistory}>
            Clear history
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-900/30 text-gray-100 ml-12 border border-blue-900'
                  : 'bg-gray-800 border border-gray-700 text-gray-200 mr-12'
              }`}
            >
              {m.role === 'assistant' && (
                <span className="text-xs text-blue-400 font-semibold block mb-1">CivicAI</span>
              )}
              {m.content}
              {m.sources?.length > 0 && (
                <div className="text-xs text-gray-600 mt-2">
                  Sources: {m.sources.join(', ')}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-500 mr-12">
              <span className="text-xs text-blue-400 font-semibold block mb-1">CivicAI</span>
              <span className="animate-pulse">Searching incidents and reasoning…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
          {QUICK_PROMPTS.slice(0, 4).map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="btn btn-ghost text-xs py-1 px-2.5"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="form-input flex-1"
            placeholder="Ask about incidents, risks, resources…"
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button className="btn btn-primary px-4" onClick={handleSend} disabled={loading}>
            ➤
          </button>
        </div>
      </div>

      {/* Right panel — 2 cols */}
      <div className="col-span-2 flex flex-col gap-4 overflow-y-auto">
        {/* RAG pipeline status */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            RAG pipeline
          </div>
          {[
            { icon: '🗄', label: `Azure AI Search — ${incidents.length} incidents indexed`, done: true },
            { icon: '🔗', label: 'Embeddings retrieved', done: true },
            { icon: '🤖', label: 'GPT-4o — grounded response', done: !loading, active: loading },
          ].map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border mb-2 text-sm ${
                s.active
                  ? 'border-blue-700 bg-blue-900/20 animate-pulse'
                  : s.done
                  ? 'border-emerald-800 bg-emerald-900/10'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              <span>{s.icon}</span>
              <span className="flex-1 text-gray-300">{s.label}</span>
              {s.done && !s.active && <span className="text-emerald-400">✓</span>}
              {s.active && <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
            </div>
          ))}
        </div>

        {/* Context window */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Context window
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {incidents.map(i => (
              <div key={i.id} className="text-xs leading-relaxed">
                <span className="font-mono text-blue-400">[{i.id}]</span>
                <span className="text-gray-400 ml-1">{i.type} — {i.area}, Sev {i.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model info */}
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Model
          </div>
          {[
            ['Provider',  'Azure OpenAI'],
            ['Model',     'GPT-4o'],
            ['Strategy',  'RAG — no hallucination'],
            ['Search',    'Azure AI Search'],
            ['Grounding', 'Incident corpus'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-1 border-b border-gray-800 last:border-0">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-300">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
