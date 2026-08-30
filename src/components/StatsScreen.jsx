import { useState } from 'react'
import { statItems, historyFor, prFor, sortedSessions, countSets, fmtDate, fmtSet, streakWeeks, todayStr, durationMin } from '../store.js'
import { PLAN, findItem } from '../plan.js'

export default function StatsScreen({ data, go }) {
  const stats = statItems()
  const [selected, setSelected] = useState(stats[0])
  const [expanded, setExpanded] = useState(null)
  const [month, setMonth] = useState(() => todayStr().slice(0, 7)) // YYYY-MM

  const monthSessions = data.sessions.filter((s) => s.date.startsWith(todayStr().slice(0, 7)) && countSets(s) > 0)
  const streak = streakWeeks(data)
  const history = historyFor(data, selected)
  const pr = prFor(data, selected)

  return (
    <>
      <button className="backrow" onClick={() => go('home')}>‹ Home</button>
      <div className="app-h">Stats</div>

      <div className="statgrid">
        <div className="stat"><div className="tag">THIS MONTH</div><div className="v num">{monthSessions.length} workouts</div></div>
        <div className="stat"><div className="tag">STREAK</div><div className="v num">{streak} {streak === 1 ? 'week' : 'weeks'} {streak >= 2 ? '🔥' : ''}</div></div>
      </div>

      <div className="seg">
        {stats.map((st) => (
          <button
            key={`${st.item.id}-${st.side || ''}`}
            className={st === selected ? 'on' : ''}
            onClick={() => setSelected(st)}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ cursor: 'default' }}>
        <div className="row-between" style={{ alignItems: 'baseline' }}>
          <b>{selected.label}</b>
          {pr && <span className="pill done">PR {fmtSet(selected.item, pr)}</span>}
        </div>
        {history.length >= 2 ? (
          <Chart history={history} />
        ) : (
          <div className="tag" style={{ marginTop: 10 }}>
            {history.length === 1 ? 'One session logged — chart appears after the next one.' : 'No sets logged yet.'}
          </div>
        )}
        {history.length >= 2 && (
          <div className="tag num">
            {fmtSet(selected.item, history[0].top)} → {fmtSet(selected.item, history[history.length - 1].top)} (top set)
          </div>
        )}
      </div>

      <Calendar data={data} month={month} setMonth={setMonth} />

      <div className="card" style={{ cursor: 'default' }}>
        <b>History</b>
        {sortedSessions(data).filter((s) => countSets(s) > 0).length === 0 && (
          <div className="tag" style={{ marginTop: 8 }}>No workouts logged yet.</div>
        )}
        {sortedSessions(data).filter((s) => countSets(s) > 0).slice(0, 30).map((s) => (
          <div key={s.id}>
            <button className="setrow num" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
              <span>{fmtDate(s.date)} · {PLAN[s.workout]?.name}</span>
              <span className="tag">{countSets(s)} sets{durationMin(s) ? ` · ${durationMin(s)} min` : ''} {s.note ? '· note 📝' : ''} {expanded === s.id ? '▴' : '▾'}</span>
            </button>
            {expanded === s.id && <SessionDetail session={s} />}
          </div>
        ))}
      </div>
    </>
  )
}

function Chart({ history }) {
  const W = 320, H = 90, PAD = 6
  const pts = history.slice(-12)
  const ws = pts.map((p) => p.top.w)
  const min = Math.min(...ws), max = Math.max(...ws)
  const span = max - min || 1
  const x = (i) => (pts.length === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (pts.length - 1))
  const y = (w) => H - PAD - ((w - min) / span) * (H - 2 * PAD - 14)
  const points = pts.map((p, i) => `${x(i)},${y(p.top.w)}`).join(' ')
  const lastPt = pts[pts.length - 1]
  return (
    <svg width="100%" height={H + 16} viewBox={`0 0 ${W} ${H + 16}`} style={{ marginTop: 8 }} role="img" aria-label="top-set weight trend">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(pts.length - 1)} cy={y(lastPt.top.w)} r="5" fill="var(--accent)" />
      <text x={PAD} y={H + 12} fill="var(--faint)" fontSize="11">{fmtDate(pts[0].date)}</text>
      <text x={W - PAD} y={H + 12} fill="var(--faint)" fontSize="11" textAnchor="end">{fmtDate(lastPt.date)}</text>
    </svg>
  )
}

function Calendar({ data, month, setMonth }) {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday-first
  const byDate = {}
  for (const s of data.sessions) {
    if (countSets(s) > 0 && s.date.startsWith(month)) byDate[Number(s.date.slice(8))] = s.workout
  }
  const shift = (d) => {
    const nd = new Date(y, m - 1 + d, 1)
    setMonth(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`)
  }
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return (
    <div className="card" style={{ cursor: 'default' }}>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <button className="backrow" onClick={() => shift(-1)}>‹</button>
        <span className="tag" style={{ letterSpacing: '0.08em' }}>
          {label.toUpperCase()} · <span style={{ color: 'var(--accent)' }}>■</span> upper <span style={{ color: 'var(--good)' }}>■</span> lower
        </span>
        <button className="backrow" onClick={() => shift(1)}>›</button>
      </div>
      <div className="cal">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="hd">{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} className="blank" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const w = byDate[i + 1]
          return <div key={i} className={w === 'upper' ? 'u' : w === 'lower' ? 'l' : ''}>{i + 1}</div>
        })}
      </div>
    </div>
  )
}

function SessionDetail({ session }) {
  return (
    <div className="lastbox" style={{ marginBottom: 8 }}>
      {Object.entries(session.entries).map(([itemId, e]) => {
        const item = findItem(session.workout, itemId)
        if (!item) return null
        const line = item.type === 'superset'
          ? (e.rounds || []).map((r) => `${fmtSet(item, r.a)}${r.b ? ` + ${fmtSet(item, r.b)}` : ''}`).join(' · ')
          : (e.sets || []).map((s) => fmtSet(item, s)).join(' · ')
        if (!line) return null
        return (
          <div key={itemId} className="num" style={{ fontSize: '0.88rem' }}>
            <span className="muted">{item.name}:</span> {line}
            {e.note && <div className="tag">📝 {e.note}</div>}
          </div>
        )
      })}
      {session.note && <div className="tag" style={{ marginTop: 6 }}>📝 {session.note}</div>}
    </div>
  )
}
