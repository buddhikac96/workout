import { useEffect, useState } from 'react'
import { WEIGHT_STEP } from '../plan.js'
import { sessionOn, todayStr, entryFor, fmtSet, lastEntrySummary, fmtDate, prefill } from '../store.js'
import Stepper from './Stepper.jsx'

export default function ExerciseScreen({ data, workout, item, go, logSet, deleteSet, setNote, startRest }) {
  const session = sessionOn(data, workout.id, todayStr())
  const entry = entryFor(session, item.id)
  const isSS = item.type === 'superset'

  // Position: next set/round to log, or an edit target.
  const [edit, setEdit] = useState(null) // { index, side } | null
  const rounds = entry?.rounds || []
  const sets = entry?.sets || []
  const lastRound = rounds[rounds.length - 1]
  const nextSide = isSS && lastRound && lastRound.a && !lastRound.b ? 'b' : 'a'
  const nextIndex = isSS ? (nextSide === 'b' ? rounds.length - 1 : rounds.length) : sets.length
  const pos = edit || { index: nextIndex, side: isSS ? nextSide : null }
  const complete = isSS ? rounds.filter((r) => r.a && r.b).length >= item.sets : sets.length >= item.sets
  const logging = edit != null || !complete

  const [w, setW] = useState(0)
  const [r, setR] = useState(0)
  const [showNote, setShowNote] = useState(Boolean(entry?.note))

  useEffect(() => {
    if (edit) {
      const cur = isSS ? rounds[edit.index]?.[edit.side] : sets[edit.index]
      if (cur) { setW(cur.w); setR(cur.r) }
    } else {
      const p = prefill(data, workout.id, item, session, pos.index, pos.side)
      setW(p.w)
      setR(p.r)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, edit, pos.index, pos.side])

  const last = lastEntrySummary(data, workout.id, item, todayStr())

  function submit() {
    logSet(workout.id, item, { set: { w, r }, round: pos.index, side: pos.side, editIndex: edit ? edit.index : null })
    if (edit) {
      setEdit(null)
    } else {
      // Rest after: every set (normal), or after B of a round (superset), if the plan gives rest.
      const restNow = !isSS || pos.side === 'b'
      const doneAfter = isSS
        ? pos.side === 'b' && pos.index + 1 >= item.sets
        : pos.index + 1 >= item.sets
      if (restNow) {
        const label = `${isSS ? `Round ${pos.index + 1}` : `Set ${pos.index + 1}`} logged · ${fmtSet(item, { w, r })}`
        startRest(item, label)
      }
      if (doneAfter) go('workout', { workout: workout.id })
    }
  }

  const weightLabel = item.type === 'bodyweight' ? 'ADDED WEIGHT (KG)' : 'WEIGHT (KG)'
  const weightUnit = item.type === 'bodyweight' ? '+kg' : 'kg'
  const repsLabel = item.type === 'perleg' ? 'REPS / LEG' : 'REPS'

  const posLabel = isSS
    ? `${pos.side === 'a' ? 'A · ' + item.a.name : 'B · ' + item.b.name} — round ${pos.index + 1}`
    : `Set ${pos.index + 1}`

  return (
    <>
      <button className="backrow" onClick={() => go('workout', { workout: workout.id })}>‹ {workout.name}</button>
      <div>
        <div className="eyebrow">
          {isSS ? `Superset · ${item.sets} rounds × ${item.reps}` : `Target ${item.sets} × ${item.reps}`}
          {item.rest > 0 ? ` · rest ${item.rest}s` : ' · no rest'}
        </div>
        <div className="app-h">{item.name}</div>
        {isSS && <div className="tag" style={{ marginTop: 2 }}>A · {item.a.name} &nbsp;+&nbsp; B · {item.b.name}</div>}
      </div>

      {last && (
        <div className="lastbox">
          <div className="tag" style={{ marginBottom: 4, letterSpacing: '0.08em' }}>LAST SESSION · {fmtDate(last.date).toUpperCase()}</div>
          {isSS ? (
            <span className="num">A · {last.a || '–'}<br />B · {last.b || '–'}</span>
          ) : (
            <span className="num">{last.sets}</span>
          )}
        </div>
      )}

      <div>
        {isSS
          ? Array.from({ length: item.sets }, (_, i) => {
              const round = rounds[i]
              return (
                <div key={i}>
                  <SetRow
                    label={`R${i + 1} · A`} set={round?.a} item={item}
                    active={!edit && pos.index === i && pos.side === 'a'}
                    editing={edit?.index === i && edit?.side === 'a'}
                    onEdit={() => round?.a && setEdit(edit?.index === i && edit?.side === 'a' ? null : { index: i, side: 'a' })}
                  />
                  <SetRow
                    label={`R${i + 1} · B`} set={round?.b} item={item}
                    active={!edit && pos.index === i && pos.side === 'b'}
                    editing={edit?.index === i && edit?.side === 'b'}
                    onEdit={() => round?.b && setEdit(edit?.index === i && edit?.side === 'b' ? null : { index: i, side: 'b' })}
                  />
                </div>
              )
            })
          : Array.from({ length: Math.max(item.sets, sets.length) }, (_, i) => (
              <SetRow
                key={i} label={`Set ${i + 1}`} set={sets[i]} item={item}
                active={!edit && pos.index === i}
                editing={edit?.index === i}
                onEdit={() => sets[i] && setEdit(edit?.index === i ? null : { index: i })}
              />
            ))}
      </div>

      {logging && (
        <>
          <div className="tag" style={{ letterSpacing: '0.08em' }}>
            {edit ? `EDITING ${posLabel.toUpperCase()}` : `NOW: ${posLabel.toUpperCase()}`}
          </div>
          <div className="grid2">
            <Stepper label={weightLabel} value={w} unit={weightUnit} step={WEIGHT_STEP} onChange={setW} />
            <Stepper label={repsLabel} value={r} unit="reps" step={1} onChange={setR} />
          </div>
        </>
      )}

      {showNote ? (
        <textarea
          className="note"
          placeholder={`Note for ${item.name} (optional)`}
          defaultValue={entry?.note || ''}
          onBlur={(e) => setNote(workout.id, item, e.target.value)}
        />
      ) : (
        <button className="backrow" onClick={() => setShowNote(true)}>+ add note 📝</button>
      )}

      <div className="spacer" />

      {edit ? (
        <div className="grid2">
          <button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>
          <button className="btn" onClick={submit}>Update ✓</button>
        </div>
      ) : complete ? (
        <button className="btn ghost" onClick={() => go('workout', { workout: workout.id })}>
          ✓ Done — back to workout
        </button>
      ) : (
        <button className="btn" onClick={submit}>
          Log {isSS ? `${pos.side.toUpperCase()} · round ${pos.index + 1}` : `set ${pos.index + 1}`} ✓
          {item.rest > 0 && (!isSS || pos.side === 'b') ? ` → ${item.rest}s rest` : ''}
        </button>
      )}
    </>
  )
}

function SetRow({ label, set, item, active, editing, onEdit }) {
  return (
    <button className="setrow num" onClick={onEdit} style={editing ? { color: 'var(--accent)' } : undefined}>
      <span style={active ? { fontWeight: 600 } : undefined}>{label}{active ? ' — now' : ''}</span>
      {set ? (
        <span className={editing ? '' : 'ok'}>
          ✓ {fmtSet(item, set)}
          <span className="edit">{editing ? 'editing…' : 'edit'}</span>
        </span>
      ) : (
        <span className="tag">{active ? 'logging…' : '–'}</span>
      )}
    </button>
  )
}
