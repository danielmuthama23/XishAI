import { useState, useRef } from 'react'
import { api } from '../services/api'
import { useOfflineSync } from '../hooks/useOfflineSync'
import SeverityBadge from '../components/SeverityBadge'
import { useIncidents, MOCK_INCIDENTS } from '../hooks/useIncidents'

const STEPS = ['Incident details', 'Media upload', 'AI analysis', 'Submit']

const INCIDENT_TYPES = [
  'Fire', 'Flood', 'Medical emergency', 'Accident',
  'Security threat', 'Building collapse', 'Power outage', 'Other',
]

const PIPELINE_STEPS = [
  { label: 'YOLOv11 — object detection',   icon: '🔍', result: 'Detected: fire, smoke, building, person' },
  { label: 'CLIP — semantic embedding',     icon: '🧠', result: 'Scene: "Structure fire with trapped occupants"' },
  { label: 'SAM — segmentation',            icon: '✂',  result: 'Isolated fire (34%), building facade (51%)' },
  { label: 'GPT-4o — reasoning',            icon: '🤖', result: 'Severity: 9/10 — Critical. Dispatch fire brigade immediately.' },
]

export default function ReportForm() {
  const [step, setStep]           = useState(0)
  const [form, setForm]           = useState({ type: 'Fire', description: '', location: '', severity: 5, transcript: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const [voiceFile, setVoiceFile] = useState(null)
  const [pipelineDone, setPipelineDone] = useState(false)
  const [pipelineProgress, setPipelineProgress] = useState(-1)
  const [aiResult, setAiResult]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [response,  setResponse]  = useState(null)
  const [error,     setError]     = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const photoRef = useRef()
  const { incidents } = useIncidents()
  const { isOnline, queueReport } = useOfflineSync()

  function updateForm(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // Animate AI pipeline steps
  async function runPipeline() {
    setPipelineDone(false)
    setPipelineProgress(-1)
    setStep(2)
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setPipelineProgress(i)
    }
    // Simulate GPT result
    setAiResult({
      severity:       form.severity >= 8 ? 9 : form.severity,
      incident_type:  form.type,
      risk_level:     form.severity >= 9 ? 'Critical' : form.severity >= 7 ? 'Serious' : 'Moderate',
      recommendation: `Dispatch ${form.type === 'Fire' ? 'fire brigade' : form.type === 'Flood' ? 'disaster response team' : 'emergency responders'} to ${form.location} immediately.`,
    })
    setPipelineDone(true)
  }

  async function submitReport() {
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.append('type',                        form.type)
    fd.append('description',                 form.description)
    fd.append('location_text',               form.location)
    fd.append('reporter_estimated_severity', form.severity)
    fd.append('voice_transcript',            form.transcript)
    if (photoFile) fd.append('photo', photoFile)
    if (voiceFile) fd.append('voice_file', voiceFile)

    try {
      if (!isOnline) {
        await queueReport(fd)
        setResponse({ incident_id: 'QUEUED', hedera_hash: 'pending-sync', severity: form.severity, notifications_sent: [] })
      } else {
        const data = await api.reportIncident(fd)
        setResponse(data)
      }
      setStep(3)
    } catch (err) {
      setError('Submission failed — report queued offline.')
      await queueReport(fd)
      setStep(3)
      setResponse({ incident_id: 'QUEUED', hedera_hash: 'pending-sync', severity: form.severity, notifications_sent: [] })
    }
    setSubmitting(false)
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left — stepper + content */}
      <div>
        {/* Step tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center py-2 text-xs transition-colors border-b-2 ${
                i === step
                  ? 'text-blue-400 border-blue-500 font-semibold'
                  : i < step
                  ? 'text-emerald-400 border-emerald-600'
                  : 'text-gray-600 border-transparent'
              }`}
            >
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {/* ── Step 0: Incident details ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Incident type</label>
              <select className="form-select" value={form.type} onChange={e => updateForm('type', e.target.value)}>
                {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Location</label>
              <input className="form-input" placeholder="Area, City (e.g. Changamwe, Mombasa)"
                value={form.location} onChange={e => updateForm('location', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Description</label>
              <textarea className="form-textarea" placeholder="Describe what you see…"
                value={form.description} onChange={e => updateForm('description', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">
                Estimated severity (1–10)
              </label>
              <input type="range" min={1} max={10} value={form.severity}
                onChange={e => updateForm('severity', Number(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Minor</span>
                <SeverityBadge score={form.severity} />
                <span>Critical</span>
              </div>
            </div>
            <button
              className="btn btn-primary w-full"
              disabled={!form.location || !form.description}
              onClick={() => setStep(1)}
            >
              Next — Add media →
            </button>
          </div>
        )}

        {/* ── Step 1: Media upload ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Photo drop zone */}
            <div
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-blue-600 transition-colors"
              onClick={() => photoRef.current?.click()}
            >
              <div className="text-4xl mb-2">{photoFile ? '🖼' : '📷'}</div>
              <div className="text-sm text-gray-400">
                {photoFile ? photoFile.name : 'Drop photo or video here'}
              </div>
              <div className="text-xs text-gray-600 mt-1">JPG, PNG, MP4 — max 50 MB</div>
              <input ref={photoRef} type="file" accept="image/*,video/*" className="hidden"
                onChange={e => setPhotoFile(e.target.files[0])} />
              <button className="btn btn-ghost text-xs mt-3" type="button"
                onClick={e => { e.stopPropagation(); photoRef.current?.click() }}>
                Choose file
              </button>
            </div>

            {/* Voice note */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-2">Voice note / transcript</div>
              <textarea className="form-textarea" placeholder="Paste voice transcript or type a description…"
                value={form.transcript} onChange={e => updateForm('transcript', e.target.value)} rows={3} />
            </div>

            {!isOnline && (
              <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2">
                ⚠ You are offline. Report will be queued and synced when connectivity returns.
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary flex-1" onClick={runPipeline}>
                Run AI analysis ↗
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: AI pipeline ── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              AI pipeline running…
            </div>
            {PIPELINE_STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  i < pipelineProgress
                    ? 'border-emerald-800 bg-emerald-900/20'
                    : i === pipelineProgress
                    ? 'border-blue-700 bg-blue-900/20 animate-pulse'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <span className="text-xl w-8">{s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">{s.label}</div>
                  {i <= pipelineProgress && (
                    <div className="text-xs text-emerald-400 mt-0.5">✓ {s.result}</div>
                  )}
                </div>
                {i < pipelineProgress && <span className="text-emerald-400 text-lg">✓</span>}
                {i === pipelineProgress && (
                  <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            ))}

            {aiResult && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl">
                <div className="text-xs font-semibold text-red-400 mb-1">AI Assessment</div>
                <div className="text-sm text-gray-200">
                  <SeverityBadge score={aiResult.severity} />
                  <span className="ml-2">{aiResult.recommendation}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary flex-1"
                disabled={!pipelineDone || submitting}
                onClick={submitReport}
              >
                {submitting ? 'Submitting…' : 'Submit report →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && response && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-700 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <div className="text-lg font-semibold text-gray-100">Report submitted</div>
            <div className="text-sm text-gray-400">Incident ID: <span className="font-mono text-gray-200">{response.incident_id}</span></div>
            {response.severity && <SeverityBadge score={response.severity} />}
            <div className="text-xs text-gray-600 font-mono bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 break-all">
              Hedera hash: {response.hedera_hash}
            </div>
            {response.notifications_sent?.length > 0 && (
              <div className="text-xs text-emerald-400">
                ✓ Notified via: {response.notifications_sent.join(', ')}
              </div>
            )}
            {response.route_to_nearest_resource && (
              <div className="text-xs text-blue-400">
                🚒 Nearest resource: {response.route_to_nearest_resource.resource_name} —
                {response.route_to_nearest_resource.distance_km} km ({response.route_to_nearest_resource.estimated_time_minutes} min)
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={() => { setStep(0); setForm({ type: 'Fire', description: '', location: '', severity: 5, transcript: '' }); setResponse(null); setPipelineDone(false); setPipelineProgress(-1); setAiResult(null) }}
            >
              Report another incident
            </button>
          </div>
        )}
      </div>

      {/* Right — sidebar info */}
      <div className="space-y-4">
        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Nearby active incidents
          </div>
          {incidents.slice(0, 4).map(i => (
            <div key={i.id} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
              <span className="w-2 h-2 rounded-full shrink-0"
                style={{ background: i.severity >= 9 ? '#E24B4A' : i.severity >= 7 ? '#EF9F27' : '#378ADD' }} />
              <div className="text-xs text-gray-300 flex-1 truncate">{i.type} — {i.area}</div>
              <span className="text-xs text-gray-600">Sev {i.severity}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Crowd verification
          </div>
          <div className="text-xs text-gray-500 mb-3">3 confirmations raise severity automatically</div>
          {[{ name: 'User A', done: true }, { name: 'User B', done: true }, { name: 'User C', done: false }].map(u => (
            <div key={u.name} className="flex items-center gap-2 py-2">
              <span className="text-sm">👤</span>
              <span className="text-sm text-gray-400 flex-1">{u.name}</span>
              {u.done
                ? <span className="text-emerald-400 text-sm">✓</span>
                : <span className="text-gray-600 text-sm">⏳</span>}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Offline sync status
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-gray-400">{isOnline ? 'Online — synced' : 'Offline — queuing'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
