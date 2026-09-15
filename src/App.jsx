import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'scamalax.state.v1'
const VERSION = 'v0.4.20-alpha'
const evidenceStates = ['OBSERVED', 'SUPPORTED', 'CORRELATED', 'INFERRED', 'DISPUTED', 'UNKNOWN']
const evidenceKinds = ['message', 'email', 'phone', 'url', 'domain', 'wallet', 'payment', 'remote-access', 'file', 'note', 'other']

const rescueSteps = [
  'Stop sending money, gift cards, crypto, or payment codes.',
  'Hang up or stop replying. Do not use contact details supplied by the suspected scammer.',
  'Disconnect remote-access software and remove unattended-access permissions.',
  'Contact your bank, card issuer, exchange, or payment service through a trusted official channel.',
  'From a trusted device, change exposed passwords and enable multi-factor authentication.',
  'Preserve messages, receipts, transaction IDs, phone numbers, URLs, and screenshots.',
  'Report the incident to the relevant platform and appropriate authorities for your location.',
]

const scamRules = [
  { label: 'Gift-card payment request', weight: 28, re: /gift\s*card|apple card|google play|steam card|target card/i },
  { label: 'Remote-access software', weight: 30, re: /anydesk|teamviewer|ultraviewer|supremo|screenconnect|remote desktop/i },
  { label: 'Urgency or pressure', weight: 14, re: /act now|immediately|right now|urgent|today only|final warning|do not delay/i },
  { label: 'Secrecy instruction', weight: 24, re: /don['’]?t tell|do not tell|keep this secret|don['’]?t contact your bank|stay on the line/i },
  { label: 'One-time code request', weight: 24, re: /otp|one[- ]time code|verification code|security code|texted you a code/i },
  { label: 'Cryptocurrency payment', weight: 18, re: /bitcoin|btc|ethereum|eth|crypto|wallet address|usdt|tether/i },
  { label: 'Bank or government impersonation language', weight: 18, re: /fraud department|federal agent|social security|irs|tax department|bank security|police department/i },
  { label: 'Refund or overpayment setup', weight: 16, re: /refund|overpayment|accidental payment|too much money|return the difference/i },
  { label: 'Irreversible transfer method', weight: 18, re: /wire transfer|zelle|cash app|western union|moneygram|bank transfer/i },
  { label: 'Cash courier / ATM direction', weight: 24, re: /cash courier|courier will collect|bitcoin atm|crypto atm|withdraw cash/i },
  { label: 'Account-threat language', weight: 14, re: /account.*suspend|account.*close|warrant|arrest|legal action|unauthorized charge/i },
]

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function nowIso() {
  return new Date().toISOString()
}

function safeLoad() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (parsed && Array.isArray(parsed.cases)) return parsed
  } catch {
    // Corrupt local state should not break the application.
  }
  return { cases: [], activeCaseId: null }
}

async function sha256(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function analyzeText(text) {
  const findings = scamRules.filter((rule) => rule.re.test(text))
  const raw = findings.reduce((sum, rule) => sum + rule.weight, 0)
  const score = Math.min(100, raw)
  const level = score >= 70 ? 'CRITICAL' : score >= 45 ? 'HIGH' : score >= 20 ? 'ELEVATED' : 'LOW'
  return { score, level, findings }
}

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function caseToMarkdown(item) {
  const lines = [
    '# SCAM-A-LAX Case Packet',
    '',
    `- **Case ID:** ${item.id}`,
    `- **Title:** ${item.title}`,
    `- **Victim alias:** ${item.victimAlias || 'Not provided'}`,
    `- **Scam type:** ${item.type || 'Unknown'}`,
    `- **Status:** ${item.status}`,
    `- **Created:** ${item.createdAt}`,
    `- **Exported:** ${nowIso()}`,
    '',
    '> Defensive evidence packet. Correlation and inference are not proof of identity or wrongdoing.',
    '',
    '## Evidence manifest',
    '',
  ]

  if (!item.evidence.length) lines.push('_No evidence recorded._')
  item.evidence.forEach((ev, index) => {
    lines.push(`### ${index + 1}. ${ev.kind.toUpperCase()} — ${ev.state}`)
    lines.push(`- **Recorded:** ${ev.recordedAt}`)
    lines.push(`- **SHA-256:** \`${ev.sha256}\``)
    if (ev.fileName) lines.push(`- **File:** ${ev.fileName} (${ev.fileSize} bytes, ${ev.fileType || 'unknown type'})`)
    if (ev.value) lines.push(`- **Value:** ${ev.value}`)
    if (ev.note) lines.push(`- **Note:** ${ev.note}`)
    lines.push('')
  })

  lines.push('## Timeline', '')
  if (!item.timeline.length) lines.push('_No timeline events._')
  item.timeline.forEach((event) => lines.push(`- **${event.at}** — ${event.text}`))
  lines.push('', '## Notes', '', item.notes || '_No case notes._', '')
  return lines.join('\n')
}

function App() {
  const [store, setStore] = useState(safeLoad)
  const [view, setView] = useState('ledger')
  const [notice, setNotice] = useState('')
  const [rescueChecks, setRescueChecks] = useState({})
  const [scanText, setScanText] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const fileRef = useRef(null)

  const activeCase = useMemo(
    () => store.cases.find((item) => item.id === store.activeCaseId) || null,
    [store],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [store])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const patchCase = (caseId, updater) => {
    setStore((current) => ({
      ...current,
      cases: current.cases.map((item) => (item.id === caseId ? updater(item) : item)),
    }))
  }

  const createCase = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') || '').trim()
    if (!title) return
    const createdAt = nowIso()
    const item = {
      id: uid('case'),
      title,
      victimAlias: String(data.get('victimAlias') || '').trim(),
      type: String(data.get('type') || '').trim(),
      status: 'OPEN',
      createdAt,
      notes: '',
      evidence: [],
      timeline: [{ id: uid('event'), at: createdAt, text: 'Case created.' }],
    }
    setStore((current) => ({ cases: [item, ...current.cases], activeCaseId: item.id }))
    event.currentTarget.reset()
    setNotice('Case created locally.')
  }

  const addEvidence = async (event) => {
    event.preventDefault()
    if (!activeCase) return
    const data = new FormData(event.currentTarget)
    const kind = String(data.get('kind') || 'note')
    const state = String(data.get('state') || 'OBSERVED')
    const value = String(data.get('value') || '').trim()
    const note = String(data.get('note') || '').trim()
    const file = fileRef.current?.files?.[0]
    if (!value && !file) {
      setNotice('Add a value or choose a file first.')
      return
    }

    let hashInput
    let fileMeta = {}
    if (file) {
      const bytes = await file.arrayBuffer()
      hashInput = bytes
      fileMeta = { fileName: file.name, fileSize: file.size, fileType: file.type }
    } else {
      hashInput = `${kind}\n${value}`
    }

    const recordedAt = nowIso()
    const evidence = {
      id: uid('ev'),
      kind: file ? 'file' : kind,
      state,
      value: file ? '' : value,
      note,
      recordedAt,
      sha256: await sha256(hashInput),
      ...fileMeta,
    }

    patchCase(activeCase.id, (item) => ({
      ...item,
      evidence: [evidence, ...item.evidence],
      timeline: [{ id: uid('event'), at: recordedAt, text: `Evidence added: ${evidence.kind} (${evidence.state}).` }, ...item.timeline],
    }))
    event.currentTarget.reset()
    if (fileRef.current) fileRef.current.value = ''
    setNotice('Evidence receipt added. Original file stayed on this device.')
  }

  const runScamCheck = () => {
    setScanResult(analyzeText(scanText))
  }

  const recordScan = async () => {
    if (!activeCase || !scanResult || !scanText.trim()) return
    const recordedAt = nowIso()
    const findingText = `ScamCheck ${scanResult.level} (${scanResult.score}/100): ${scanResult.findings.map((f) => f.label).join(', ') || 'No configured indicators matched.'}`
    const evidence = {
      id: uid('ev'),
      kind: 'message',
      state: 'INFERRED',
      value: scanText.trim(),
      note: findingText,
      recordedAt,
      sha256: await sha256(`message\n${scanText.trim()}`),
    }
    patchCase(activeCase.id, (item) => ({
      ...item,
      evidence: [evidence, ...item.evidence],
      timeline: [{ id: uid('event'), at: recordedAt, text: 'ScamCheck analysis recorded as INFERRED.' }, ...item.timeline],
    }))
    setNotice('Analysis recorded as INFERRED, not proof.')
  }

  const updateNotes = (value) => {
    if (!activeCase) return
    patchCase(activeCase.id, (item) => ({ ...item, notes: value }))
  }

  const exportCase = (format) => {
    if (!activeCase) return
    const base = activeCase.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'case'
    if (format === 'json') {
      const packet = { schema: 'scamalax.case.v1', exportedAt: nowIso(), appVersion: VERSION, case: activeCase }
      download(`${base}-scamalax.json`, JSON.stringify(packet, null, 2), 'application/json')
    } else {
      download(`${base}-scamalax.md`, caseToMarkdown(activeCase), 'text/markdown')
    }
  }

  const setStatus = (status) => {
    if (!activeCase) return
    const at = nowIso()
    patchCase(activeCase.id, (item) => ({
      ...item,
      status,
      timeline: [{ id: uid('event'), at, text: `Case status changed to ${status}.` }, ...item.timeline],
    }))
  }

  const removeAllLocalData = () => {
    if (!window.confirm('Delete every local SCAM-A-LAX case from this browser? This cannot be undone.')) return
    localStorage.removeItem(STORAGE_KEY)
    setStore({ cases: [], activeCaseId: null })
    setNotice('Local case data deleted.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">SCAM INTELLIGENCE &amp; EVIDENCE WORKSTATION</div>
          <h1>SCAM-A-LAX</h1>
          <p className="tagline">Flush scams. Preserve evidence.</p>
        </div>
        <div className="version-card">
          <span>{VERSION}</span>
          <small>LOCAL-FIRST / DEFENSIVE</small>
        </div>
      </header>

      <div className="safety-strip">
        <strong>Bounded use:</strong> No unauthorized access, retaliation, doxxing, malware, or credential theft. Correlation is not guilt.
      </div>

      <main className="workspace">
        <aside className="sidebar panel">
          <div className="section-heading">
            <div>
              <span className="kicker">CASE DESK</span>
              <h2>Local cases</h2>
            </div>
            <span className="count-pill">{store.cases.length}</span>
          </div>

          <form className="case-form" onSubmit={createCase}>
            <input name="title" placeholder="Case title" aria-label="Case title" required />
            <input name="victimAlias" placeholder="Victim alias (optional)" aria-label="Victim alias" />
            <input name="type" placeholder="Scam type (optional)" aria-label="Scam type" />
            <button className="primary" type="submit">+ New case</button>
          </form>

          <div className="case-list">
            {store.cases.length === 0 && <p className="muted empty">No cases yet. A rare moment of peace on the internet.</p>}
            {store.cases.map((item) => (
              <button
                key={item.id}
                className={`case-row ${item.id === store.activeCaseId ? 'active' : ''}`}
                onClick={() => setStore((current) => ({ ...current, activeCaseId: item.id }))}
              >
                <span>{item.title}</span>
                <small>{item.status} · {item.evidence.length} evidence</small>
              </button>
            ))}
          </div>

          <button className="danger-link" onClick={removeAllLocalData}>Delete all local data</button>
        </aside>

        <section className="content">
          <nav className="tabs" aria-label="SCAM-A-LAX modules">
            {[
              ['ledger', 'Scam Ledger'],
              ['check', 'ScamCheck'],
              ['rescue', 'Victim Rescue'],
              ['packet', 'Case Packet'],
            ].map(([id, label]) => (
              <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>
            ))}
          </nav>

          {!activeCase && (
            <div className="hero-empty panel">
              <div className="toilet-mark">🚽</div>
              <span className="kicker">READY</span>
              <h2>Sir, the Scam-A-Lax software is installed.</h2>
              <p>Create a case to proceed with Scam Ledger alpha v4.20.</p>
              <div className="terminal">
                <div>&gt; evidence boundary: ACTIVE</div>
                <div>&gt; unauthorized intrusion tools: NOT INSTALLED</div>
                <div>&gt; common sense module: BEST EFFORT</div>
              </div>
            </div>
          )}

          {activeCase && (
            <>
              <section className="case-header panel">
                <div>
                  <span className="kicker">ACTIVE CASE</span>
                  <h2>{activeCase.title}</h2>
                  <p>{activeCase.victimAlias || 'No victim alias'} · {activeCase.type || 'Type unknown'} · Created {new Date(activeCase.createdAt).toLocaleString()}</p>
                </div>
                <select value={activeCase.status} onChange={(e) => setStatus(e.target.value)} aria-label="Case status">
                  <option>OPEN</option>
                  <option>CONTAINED</option>
                  <option>REFERRED</option>
                  <option>CLOSED</option>
                </select>
              </section>

              {view === 'ledger' && (
                <div className="module-grid">
                  <section className="panel">
                    <div className="section-heading">
                      <div><span className="kicker">SCAM LEDGER</span><h2>Add evidence receipt</h2></div>
                    </div>
                    <form className="evidence-form" onSubmit={addEvidence}>
                      <div className="two-col">
                        <label>Kind
                          <select name="kind" defaultValue="message">
                            {evidenceKinds.map((kind) => <option key={kind}>{kind}</option>)}
                          </select>
                        </label>
                        <label>Evidence state
                          <select name="state" defaultValue="OBSERVED">
                            {evidenceStates.map((state) => <option key={state}>{state}</option>)}
                          </select>
                        </label>
                      </div>
                      <label>Value / indicator
                        <textarea name="value" rows="4" placeholder="Message text, phone, URL, wallet, transaction ID, observation…" />
                      </label>
                      <label>Original file (optional)
                        <input ref={fileRef} name="file" type="file" />
                        <small>The browser hashes the file. This MVP does not store or upload its bytes.</small>
                      </label>
                      <label>Analyst note
                        <input name="note" placeholder="Why this matters, source context, caveat…" />
                      </label>
                      <button className="primary" type="submit">Hash + add receipt</button>
                    </form>
                  </section>

                  <section className="panel">
                    <div className="section-heading">
                      <div><span className="kicker">MANIFEST</span><h2>{activeCase.evidence.length} evidence records</h2></div>
                    </div>
                    <div className="evidence-list">
                      {activeCase.evidence.length === 0 && <p className="muted empty">Nothing recorded yet.</p>}
                      {activeCase.evidence.map((ev) => (
                        <article className="evidence-card" key={ev.id}>
                          <div className="evidence-top">
                            <span className={`state state-${ev.state.toLowerCase()}`}>{ev.state}</span>
                            <span className="kind">{ev.kind}</span>
                            <time>{new Date(ev.recordedAt).toLocaleString()}</time>
                          </div>
                          {ev.fileName ? <strong>{ev.fileName}</strong> : <p>{ev.value}</p>}
                          {ev.note && <p className="note">{ev.note}</p>}
                          <code>sha256:{ev.sha256}</code>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {view === 'check' && (
                <section className="panel module-single">
                  <span className="kicker">SCAMCHECK</span>
                  <h2>Explainable local message triage</h2>
                  <p className="muted">Paste suspicious text. Rules run entirely in this browser and produce indicators, not a verdict.</p>
                  <textarea className="scanner" rows="10" value={scanText} onChange={(e) => setScanText(e.target.value)} placeholder="Paste a suspicious message, email body, payment instruction, or call notes…" />
                  <div className="button-row">
                    <button className="primary" onClick={runScamCheck} disabled={!scanText.trim()}>Analyze locally</button>
                    {scanResult && <button onClick={recordScan}>Record as INFERRED</button>}
                  </div>
                  {scanResult && (
                    <div className={`risk-card risk-${scanResult.level.toLowerCase()}`}>
                      <div className="risk-score"><strong>{scanResult.score}</strong><span>/100</span></div>
                      <div>
                        <span className="kicker">{scanResult.level} INDICATOR LOAD</span>
                        <h3>{scanResult.findings.length ? `${scanResult.findings.length} configured indicators matched` : 'No configured indicators matched'}</h3>
                        <div className="chips">{scanResult.findings.map((finding) => <span key={finding.label}>{finding.label}</span>)}</div>
                        <p>This score is a triage aid. Legitimate messages can match rules, and scams can avoid them.</p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {view === 'rescue' && (
                <section className="panel module-single rescue">
                  <span className="kicker">VICTIM RESCUE</span>
                  <h2>I think I’m being scammed right now.</h2>
                  <p className="rescue-lead">Prioritize stopping additional loss and regaining control. Do not confront or retaliate.</p>
                  <div className="rescue-list">
                    {rescueSteps.map((step, index) => (
                      <label key={step} className={rescueChecks[index] ? 'checked' : ''}>
                        <input type="checkbox" checked={Boolean(rescueChecks[index])} onChange={(e) => setRescueChecks((current) => ({ ...current, [index]: e.target.checked }))} />
                        <span><strong>{index + 1}</strong>{step}</span>
                      </label>
                    ))}
                  </div>
                  <div className="callout">If there is immediate danger to a person, use the emergency service appropriate for your location.</div>
                </section>
              )}

              {view === 'packet' && (
                <div className="module-grid packet-grid">
                  <section className="panel">
                    <span className="kicker">CASE PACKET</span>
                    <h2>Export for review or handoff</h2>
                    <p className="muted">Exports contain only the local case record and file metadata, not the original file bytes.</p>
                    <div className="packet-stats">
                      <div><strong>{activeCase.evidence.length}</strong><span>Evidence records</span></div>
                      <div><strong>{activeCase.timeline.length}</strong><span>Timeline events</span></div>
                      <div><strong>{new Set(activeCase.evidence.map((ev) => ev.kind)).size}</strong><span>Indicator types</span></div>
                    </div>
                    <div className="button-row stack-mobile">
                      <button className="primary" onClick={() => exportCase('md')}>Download Markdown packet</button>
                      <button onClick={() => exportCase('json')}>Download JSON archive</button>
                    </div>
                  </section>
                  <section className="panel">
                    <span className="kicker">INVESTIGATOR NOTES</span>
                    <h2>Case context</h2>
                    <textarea rows="13" value={activeCase.notes} onChange={(e) => updateNotes(e.target.value)} placeholder="Context, actions taken, handoff notes, unresolved questions…" />
                    <small className="muted">Saved locally in this browser.</small>
                  </section>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer>
        <span>FREE · OPEN SOURCE · PEOPLE POWERED</span>
        <span>Same internet. Fewer victims. That’s the goal.</span>
      </footer>

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}

export default App
