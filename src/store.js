import { get, set } from 'idb-keyval'
import { PLAN } from './plan.js'

const DATA_KEY = 'workout-data-v1'

// Data shape:
// {
//   sessions: [{
//     id, date: 'YYYY-MM-DD', workout: 'upper'|'lower', note: '',
//     startedAt, finishedAt: ms | null,
//     entries: {
//       [itemId]: {
//         note: '',
//         sets: [{ w, r }],                      // weight/bodyweight/perleg
//         rounds: [{ a: {w,r}, b: {w,r}|null }], // superset
//       }
//     }
//   }],
//   lastSync: ms | null
// }

export const emptyData = () => ({ sessions: [], lastSync: null })

export async function loadData() {
  const data = await get(DATA_KEY)
  return data || emptyData()
}

export async function saveData(data) {
  await set(DATA_KEY, data)
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function daysAgo(dateStr) {
  const then = new Date(dateStr + 'T12:00:00')
  const now = new Date(todayStr() + 'T12:00:00')
  const diff = Math.round((now - then) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}

// ---- session helpers ----

export function sortedSessions(data) {
  return [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function lastSessionOf(data, workoutId, { excludeDate } = {}) {
  return sortedSessions(data).find(
    (s) => s.workout === workoutId && s.date !== excludeDate && countSets(s) > 0
  ) || null
}

export function sessionOn(data, workoutId, date) {
  return data.sessions.find((s) => s.workout === workoutId && s.date === date) || null
}

export function countSets(session) {
  let n = 0
  for (const e of Object.values(session.entries || {})) {
    n += (e.sets?.length || 0)
    for (const r of e.rounds || []) n += (r.a ? 1 : 0) + (r.b ? 1 : 0)
  }
  return n
}

export function entryFor(session, itemId) {
  return session?.entries?.[itemId] || null
}

// Sets completed for an item (superset counts full rounds).
export function setsDone(session, item) {
  const e = entryFor(session, item.id)
  if (!e) return 0
  if (item.type === 'superset') return (e.rounds || []).filter((r) => r.a && r.b).length
  return e.sets?.length || 0
}

export function isItemDone(session, item) {
  return setsDone(session, item) >= item.sets
}

// ---- last-session display strings ----

const fmtW = (w) => (w % 1 === 0 ? String(w) : w.toFixed(1))

export function fmtSet(item, s) {
  if (!s) return '–'
  if (item.type === 'bodyweight') return s.w > 0 ? `BW+${fmtW(s.w)}×${s.r}` : `BW×${s.r}`
  return `${fmtW(s.w)}×${s.r}`
}

export function lastEntrySummary(data, workoutId, item, excludeDate) {
  const last = lastSessionOf(data, workoutId, { excludeDate })
  if (!last) return null
  const e = entryFor(last, item.id)
  if (!e) return null
  if (item.type === 'superset') {
    const a = (e.rounds || []).map((r) => fmtSet(item, r.a)).join(' · ')
    const b = (e.rounds || []).map((r) => fmtSet(item, r.b)).join(' · ')
    if (!a && !b) return null
    return { date: last.date, a, b }
  }
  const sets = (e.sets || []).map((s) => fmtSet(item, s)).join(' · ')
  if (!sets) return null
  return { date: last.date, sets }
}

// Prefill for the next set: same set index last session, else previous set now, else last session's first set.
export function prefill(data, workoutId, item, session, setIndex, side) {
  const cur = entryFor(session, item.id)
  const last = lastSessionOf(data, workoutId, { excludeDate: session?.date })
  const lastE = last ? entryFor(last, item.id) : null
  const pick = (e, i) => {
    if (!e) return null
    if (item.type === 'superset') return e.rounds?.[i]?.[side] || null
    return e.sets?.[i] || null
  }
  return (
    pick(lastE, setIndex) ||
    (setIndex > 0 && pick(cur, setIndex - 1)) ||
    pick(lastE, 0) ||
    { w: item.type === 'bodyweight' ? 0 : 10, r: 10 }
  )
}

// ---- stats helpers ----

export function statItems() {
  const out = []
  for (const w of Object.values(PLAN)) {
    for (const item of w.items) {
      if (item.type === 'superset') {
        out.push({ workout: w.id, item, side: 'a', label: item.a.name })
        out.push({ workout: w.id, item, side: 'b', label: item.b.name })
      } else {
        out.push({ workout: w.id, item, side: null, label: item.name })
      }
    }
  }
  return out
}

// Per-session top set for one stat item, oldest first.
export function historyFor(data, stat) {
  const rows = []
  for (const s of sortedSessions(data).reverse()) {
    if (s.workout !== stat.workout) continue
    const e = entryFor(s, stat.item.id)
    if (!e) continue
    const sets = stat.side ? (e.rounds || []).map((r) => r[stat.side]).filter(Boolean) : e.sets || []
    if (!sets.length) continue
    const top = sets.reduce((best, x) => (x.w > best.w || (x.w === best.w && x.r > best.r) ? x : best))
    rows.push({ date: s.date, top, sets })
  }
  return rows
}

export function prFor(data, stat) {
  let pr = null
  for (const row of historyFor(data, stat)) {
    if (!pr || row.top.w > pr.w || (row.top.w === pr.w && row.top.r > pr.r)) {
      pr = { ...row.top, date: row.date }
    }
  }
  return pr
}

export function durationMin(session) {
  if (!session.startedAt || !session.finishedAt) return null
  const min = Math.round((session.finishedAt - session.startedAt) / 60000)
  return min >= 1 && min <= 300 ? min : null
}

export function weekKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = (d.getDay() + 6) % 7 // Mon = 0
  d.setDate(d.getDate() - day)
  return todayStr(d)
}

export function streakWeeks(data) {
  const weeks = new Set(data.sessions.filter((s) => countSets(s) > 0).map((s) => weekKey(s.date)))
  if (!weeks.size) return 0
  let streak = 0
  const cur = new Date(weekKey(todayStr()) + 'T12:00:00')
  // Current week counts if trained; otherwise start from last week.
  if (!weeks.has(todayStr(cur))) cur.setDate(cur.getDate() - 7)
  while (weeks.has(todayStr(cur))) {
    streak++
    cur.setDate(cur.getDate() - 7)
  }
  return streak
}
