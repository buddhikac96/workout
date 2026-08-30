import { useState } from 'react'
import { loadSettings, saveSettings, isConfigured, pushData, pullData } from '../sync.js'
import { saveData } from '../store.js'

export default function SettingsScreen({ data, update, go, showToast }) {
  const [s, setS] = useState(loadSettings)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value.trim() })

  function save() {
    saveSettings(s)
    showToast('Settings saved')
  }

  async function push() {
    saveSettings(s)
    setBusy(true)
    try {
      const ts = await pushData(data)
      update((d) => ((d.lastSync = ts), d))
      showToast('☁️ Pushed to GitHub')
    } catch (err) {
      showToast(`⚠ ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function pull() {
    saveSettings(s)
    setBusy(true)
    try {
      const { data: merged, added } = await pullData(data)
      await saveData(merged)
      update(() => merged)
      showToast(added ? `☁️ Restored ${added} session${added === 1 ? '' : 's'} from GitHub` : 'Already up to date')
    } catch (err) {
      showToast(`⚠ ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ sessions: data.sessions }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `workout-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <button className="backrow" onClick={() => go('home')}>‹ Home</button>
      <div>
        <div className="eyebrow">Local-first · syncs when online</div>
        <div className="app-h">GitHub sync</div>
      </div>

      <div className="lastbox">
        Data saves to this phone instantly and pushes <b>data.json</b> to your repo after each
        finished workout. Create a <b>fine-grained personal access token</b> (github.com → Settings
        → Developer settings) with <b>Contents: read &amp; write</b> access to only this repo. The
        token stays on this phone.
      </div>

      <div>
        <div className="tag" style={{ marginBottom: 6, letterSpacing: '0.08em' }}>REPO (OWNER/NAME)</div>
        <input className="text" value={s.repo} onChange={set('repo')} placeholder="buddhikac96/workout" />
      </div>
      <div>
        <div className="tag" style={{ marginBottom: 6, letterSpacing: '0.08em' }}>BRANCH</div>
        <input className="text" value={s.branch} onChange={set('branch')} placeholder="main" />
      </div>
      <div>
        <div className="tag" style={{ marginBottom: 6, letterSpacing: '0.08em' }}>ACCESS TOKEN</div>
        <input className="text" type="password" value={s.token} onChange={set('token')} placeholder="github_pat_…" />
      </div>

      <button className="btn" onClick={save}>Save settings</button>
      <div className="grid2">
        <button className="btn ghost" disabled={busy || !isConfigured(s)} onClick={push}>⬆ Push now</button>
        <button className="btn ghost" disabled={busy || !isConfigured(s)} onClick={pull}>⬇ Restore</button>
      </div>
      <button className="backrow" onClick={exportJson}>⤓ Download backup JSON</button>
    </>
  )
}
