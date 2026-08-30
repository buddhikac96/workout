import { useState } from 'react'

export default function Stepper({ label, value, unit, step, onChange }) {
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    setTyping(false)
    const n = parseFloat(draft)
    if (!Number.isNaN(n) && n >= 0) onChange(Math.round(n * 10) / 10)
  }

  return (
    <div>
      <div className="tag" style={{ marginBottom: 6, letterSpacing: '0.08em' }}>{label}</div>
      <div className="stepper">
        <button onClick={() => onChange(Math.max(0, Math.round((value - step) * 10) / 10))} aria-label={`decrease ${label}`}>−</button>
        {typing ? (
          <input
            className="val"
            type="number"
            inputMode="decimal"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
        ) : (
          <button className="val" onClick={() => { setDraft(String(value)); setTyping(true) }}>
            {value % 1 === 0 ? value : value.toFixed(1)}
            <span className="unit">{unit}</span>
          </button>
        )}
        <button onClick={() => onChange(Math.round((value + step) * 10) / 10)} aria-label={`increase ${label}`}>+</button>
      </div>
    </div>
  )
}
