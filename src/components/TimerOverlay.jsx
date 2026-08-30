import { useEffect, useRef, useState } from 'react'

const CIRC = 2 * Math.PI * 103

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    setTimeout(() => ctx.close(), 800)
  } catch { /* audio unavailable */ }
}

export default function TimerOverlay({ seconds, label, onDone }) {
  const [left, setLeft] = useState(seconds)
  const [total, setTotal] = useState(seconds)
  const endAt = useRef(Date.now() + seconds * 1000)

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        navigator.vibrate?.([200, 100, 200])
        beep()
        onDone()
      }
    }, 250)
    return () => clearInterval(id)
  }, [onDone])

  const addTime = (s) => {
    endAt.current += s * 1000
    setTotal((t) => t + s)
    setLeft(Math.max(0, Math.round((endAt.current - Date.now()) / 1000)))
  }

  const m = Math.floor(left / 60)
  const s = String(left % 60).padStart(2, '0')

  return (
    <div className="timer-overlay">
      <div className="timer-inner">
        <div className="timerwrap">
          <div className="eyebrow">{label}</div>
          <div className="ring">
            <svg width="230" height="230" viewBox="0 0 230 230">
              <circle cx="115" cy="115" r="103" fill="none" stroke="var(--surface-2)" strokeWidth="12" />
              <circle
                cx="115" cy="115" r="103" fill="none" stroke="var(--accent)" strokeWidth="12"
                strokeLinecap="round" strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - Math.min(left, total) / total)}
              />
            </svg>
            <div className="t">
              <div className="big num">{m}:{s}</div>
              <div className="muted">rest</div>
            </div>
          </div>
          <div className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Vibrates + beeps at zero.
          </div>
        </div>
        <div className="spacer" />
        <div className="grid2">
          <button className="btn ghost" onClick={onDone}>Skip rest</button>
          <button className="btn ghost" onClick={() => addTime(30)}>+30 s</button>
        </div>
      </div>
    </div>
  )
}
