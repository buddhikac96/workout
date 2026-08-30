// GitHub sync: pushes/pulls data.json to a repo via the Contents API.
// Settings (token, repo, branch, path) live in localStorage only — never in the repo.

const SETTINGS_KEY = 'workout-github-settings'

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaults()
  } catch {
    return defaults()
  }
}

const defaults = () => ({ token: '', repo: 'buddhikac96/workout', branch: 'main', path: 'data.json' })

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function isConfigured(s = loadSettings()) {
  return Boolean(s.token && s.repo)
}

function apiUrl(s) {
  return `https://api.github.com/repos/${s.repo}/contents/${s.path}`
}

function headers(s) {
  return {
    Authorization: `Bearer ${s.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// Unicode-safe base64
const enc = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str)))
const dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))

async function getRemote(s) {
  const res = await fetch(`${apiUrl(s)}?ref=${s.branch}`, { headers: headers(s) })
  if (res.status === 404) return { sha: null, data: null }
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`)
  const json = await res.json()
  return { sha: json.sha, data: JSON.parse(dec(json.content.replace(/\n/g, ''))) }
}

export async function pushData(data) {
  const s = loadSettings()
  if (!isConfigured(s)) throw new Error('GitHub not configured')
  const { sha } = await getRemote(s)
  const body = {
    message: `sync ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    content: enc(JSON.stringify({ sessions: data.sessions }, null, 2)),
    branch: s.branch,
  }
  if (sha) body.sha = sha
  const res = await fetch(apiUrl(s), { method: 'PUT', headers: headers(s), body: JSON.stringify(body) })
  if (!res.ok) {
    const msg = res.status === 401 ? 'token rejected' : res.status === 404 ? 'repo not found (check token access)' : `HTTP ${res.status}`
    throw new Error(`GitHub push failed: ${msg}`)
  }
  return Date.now()
}

// Pull remote sessions and merge: union by session id; on conflict the one with more sets wins.
export async function pullData(localData) {
  const s = loadSettings()
  if (!isConfigured(s)) throw new Error('GitHub not configured')
  const { data: remote } = await getRemote(s)
  if (!remote?.sessions) return { data: localData, added: 0 }
  const byId = new Map(localData.sessions.map((x) => [x.id, x]))
  let added = 0
  const size = (x) => JSON.stringify(x).length
  for (const rs of remote.sessions) {
    const local = byId.get(rs.id)
    if (!local) {
      byId.set(rs.id, rs)
      added++
    } else if (size(rs) > size(local)) {
      byId.set(rs.id, rs)
    }
  }
  return { data: { ...localData, sessions: [...byId.values()] }, added }
}
