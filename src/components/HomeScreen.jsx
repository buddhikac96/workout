import { WORKOUTS, workoutForDay } from '../plan.js'
import { lastSessionOf, countSets, fmtDate, daysAgo, todayStr, sessionOn } from '../store.js'

export default function HomeScreen({ data, go }) {
  const now = new Date()
  const today = workoutForDay(now.getDay())
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })

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

      <button className="btn ghost" onClick={() => go('stats')}>📈 Stats & history</button>
    </>
  )
}
