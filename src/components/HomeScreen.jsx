import { WORKOUTS, workoutForDay } from '../plan.js'
import { lastSessionOf, countSets, fmtDate, daysAgo, todayStr, sessionOn } from '../store.js'
import { isConfigured } from '../sync.js'

export default function HomeScreen({ data, go }) {
  const now = new Date()
  const today = workoutForDay(now.getDay())
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
  const lastSync = data.lastSync
    ? new Date(data.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      <div>
        <div className="eyebrow">{dateLabel}</div>
        <div className="app-h">{today ? 'Time to train 💪' : 'Rest day 🔴'}</div>
      </div>

      {WORKOUTS.map((w) => {
        const isToday = today?.id === w.id
        const last = lastSessionOf(data, w.id)
        const active = sessionOn(data, w.id, todayStr())
        const inProgress = active && !active.finishedAt && countSets(active) > 0
        return (
          <button key={w.id} className="card" style={isToday ? undefined : { opacity: 0.65 }} onClick={() => go('workout', { workout: w.id })}>
            <div className="row-between">
              <div className="app-h" style={{ fontSize: '1.5rem' }}>{w.name}</div>
              {inProgress ? (
                <span className="pill done">IN PROGRESS</span>
              ) : isToday ? (
                <span className="pill today">TODAY</span>
              ) : (
                <span className="tag">{w.daysLabel}</span>
              )}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>{w.summary}</div>
            <div className="tag num" style={{ marginTop: 10 }}>
              {last ? `Last done: ${fmtDate(last.date)}, ${daysAgo(last.date)} · ${countSets(last)} sets` : 'Not logged yet'}
            </div>
          </button>
        )
      })}

      <div className="spacer" />

      <button className="lastbox row-between" style={{ border: '1px dashed var(--line-2)', background: 'var(--surface-3)', cursor: 'pointer', color: 'inherit', font: 'inherit', width: '100%' }} onClick={() => go('settings')}>
        <span>{lastSync ? '☁️ Synced to GitHub' : isConfigured() ? '☁️ GitHub sync ready' : '☁️ GitHub sync not set up'}</span>
        <span className="tag num">{lastSync || (isConfigured() ? 'pushes on finish' : 'tap to set up')}</span>
      </button>
      <button className="btn ghost" onClick={() => go('stats')}>📈 Stats & history</button>
    </>
  )
}
