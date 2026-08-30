import { useEffect, useRef, useState } from 'react'
import { loadData, saveData, emptyData, todayStr, sessionOn } from './store.js'
import { PLAN } from './plan.js'
import HomeScreen from './components/HomeScreen.jsx'
import WorkoutScreen from './components/WorkoutScreen.jsx'
import ExerciseScreen from './components/ExerciseScreen.jsx'
import StatsScreen from './components/StatsScreen.jsx'
import TimerOverlay from './components/TimerOverlay.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [nav, setNav] = useState({ screen: 'home', workout: null, item: null })
  const [timer, setTimer] = useState(null) // { seconds, label }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    loadData().then(setData).catch(() => setData(emptyData()))
  }, [])

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function update(fn) {
    setData((prev) => {
      const next = fn(structuredClone(prev))
      saveData(next).catch(() => showToast('⚠ Could not save locally'))
      return next
    })
  }

  // Mutations ----------------------------------------------------------------

  function ensureSession(d, workoutId) {
    const date = todayStr()
    let s = sessionOn(d, workoutId, date)
    if (!s) {
      s = { id: `${date}-${workoutId}`, date, workout: workoutId, note: '', startedAt: Date.now(), finishedAt: null, entries: {} }
      d.sessions.push(s)
    }
    return s
  }

  function logSet(workoutId, item, { set, round, side, editIndex }) {
    update((d) => {
      const s = ensureSession(d, workoutId)
      const e = (s.entries[item.id] ||= item.type === 'superset' ? { rounds: [], note: '' } : { sets: [], note: '' })
      // Edits keep the set's original timestamp; new sets are stamped now.
      if (item.type === 'superset') {
        if (editIndex != null) e.rounds[editIndex][side] = { ...set, t: e.rounds[editIndex][side]?.t }
        else {
          if (side === 'a') e.rounds.push({ a: { ...set, t: Date.now() }, b: null })
          else e.rounds[e.rounds.length - 1].b = { ...set, t: Date.now() }
        }
      } else {
        if (editIndex != null) e.sets[editIndex] = { ...set, t: e.sets[editIndex]?.t }
        else e.sets.push({ ...set, t: Date.now() })
      }
      return d
    })
  }

  function deleteSet(workoutId, item, { index, side }) {
    update((d) => {
      const s = sessionOn(d, workoutId, todayStr())
      const e = s?.entries?.[item.id]
      if (!e) return d
      if (item.type === 'superset') {
        if (side === 'b') e.rounds[index].b = null
        else e.rounds.splice(index, 1)
      } else {
        e.sets.splice(index, 1)
      }
      return d
    })
  }

  function setExerciseNote(workoutId, item, note) {
    update((d) => {
      const s = ensureSession(d, workoutId)
      const e = (s.entries[item.id] ||= item.type === 'superset' ? { rounds: [], note: '' } : { sets: [], note: '' })
      e.note = note
      return d
    })
  }

  function finishWorkout(workoutId, note) {
    update((d) => {
      const s = sessionOn(d, workoutId, todayStr())
      if (s) {
        s.note = note
        s.finishedAt = Date.now()
      }
      return d
    })
    setNav({ screen: 'home' })
    showToast('✓ Workout saved')
  }

  function startRest(item, label) {
    if (item.rest > 0) setTimer({ seconds: item.rest, label })
  }

  // --------------------------------------------------------------------------

  if (!data) return null

  const go = (screen, extra = {}) => setNav({ screen, ...extra })

  return (
    <div className="app">
      {nav.screen === 'home' && <HomeScreen data={data} go={go} showToast={showToast} setData={setData} />}
      {nav.screen === 'workout' && (
        <WorkoutScreen data={data} workout={PLAN[nav.workout]} go={go} onFinish={finishWorkout} />
      )}
      {nav.screen === 'exercise' && (
        <ExerciseScreen
          data={data}
          workout={PLAN[nav.workout]}
          item={nav.item}
          go={go}
          logSet={logSet}
          deleteSet={deleteSet}
          setNote={setExerciseNote}
          startRest={startRest}
        />
      )}
      {nav.screen === 'stats' && <StatsScreen data={data} update={update} go={go} showToast={showToast} />}
      {timer && <TimerOverlay seconds={timer.seconds} label={timer.label} onDone={() => setTimer(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
