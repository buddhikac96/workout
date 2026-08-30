import { useState } from 'react'
import { sessionOn, todayStr, setsDone, isItemDone, entryFor, fmtSet, lastEntrySummary, fmtDate, countSets } from '../store.js'

export default function WorkoutScreen({ data, workout, go, onFinish }) {
  const session = sessionOn(data, workout.id, todayStr())
  const [finishing, setFinishing] = useState(false)
  const [note, setNote] = useState(session?.note || '')
  const done = workout.items.filter((i) => isItemDone(session, i)).length
  const hasSets = session && countSets(session) > 0
  const dayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long' })

  return (
    <>
      <button className="backrow" onClick={() => go('home')}>‹ Home</button>
      <div>
        <div className="eyebrow">{workout.name} · {dayLabel}</div>
        <div className="app-h">
          Exercises <span className="muted num" style={{ fontSize: '1rem', fontFamily: 'Barlow' }}>{done} of {workout.items.length} done</span>
        </div>
      </div>

      {workout.items.map((item) => {
        const n = setsDone(session, item)
        const complete = n >= item.sets
        const todayEntry = entryFor(session, item.id)
        const todayLine = summaryLine(item, todayEntry)
        const last = lastEntrySummary(data, workout.id, item, todayStr())
        return (
          <button key={item.id} className="card" onClick={() => go('exercise', { workout: workout.id, item })}>
            <div className="row-between">
              <b>{item.name}</b>
              {complete ? (
                <span className="pill done">✓ {n}/{item.sets}</span>
              ) : item.type === 'superset' ? (
                <span className="pill ss">SUPERSET {n}/{item.sets}</span>
              ) : (
                <span className="tag num">{n}/{item.sets}</span>
              )}
            </div>
            <div className="tag num" style={{ marginTop: 6 }}>
              {todayLine
                ? `Today: ${todayLine}`
                : last
                  ? item.type === 'superset'
                    ? `Last ${fmtDate(last.date)}: A ${last.a || '–'} · B ${last.b || '–'}`
                    : `Last ${fmtDate(last.date)}: ${last.sets}`
                  : `Target ${item.sets}×${item.reps}${item.rest > 0 ? ` · rest ${item.rest}s` : ''}`}
            </div>
            {item.hint && <div className="tag" style={{ marginTop: 4 }}>{item.hint}</div>}
          </button>
        )
      })}

      <div className="spacer" />

      {finishing ? (
        <>
          <textarea
            className="note"
            placeholder="Session note (optional) — e.g. shoulder felt tight"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
          <div className="grid2">
            <button className="btn ghost" onClick={() => setFinishing(false)}>Back</button>
            <button className="btn" onClick={() => onFinish(workout.id, note)}>Finish ✓</button>
          </div>
        </>
      ) : (
        <button className="btn ghost" disabled={!hasSets} onClick={() => setFinishing(true)}>
          Finish workout · add session note 📝
        </button>
      )}
    </>
  )
}

function summaryLine(item, entry) {
  if (!entry) return null
  if (item.type === 'superset') {
    const rounds = (entry.rounds || []).filter((r) => r.a)
    if (!rounds.length) return null
    return rounds.map((r) => `${fmtSet(item, r.a)}${r.b ? `+${fmtSet(item, r.b)}` : ''}`).join(' · ')
  }
  const sets = entry.sets || []
  if (!sets.length) return null
  return sets.map((s) => fmtSet(item, s)).join(' · ')
}
