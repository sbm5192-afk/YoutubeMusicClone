// Client-side helpers for the analytics beacon (see /api/track)
export function getSid(): string {
  try {
    let id = localStorage.getItem('ekko_sid')
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('ekko_sid', id)
    }
    return id
  } catch {
    return 'anon-' + Math.random().toString(36).slice(2, 12)
  }
}

export function sendTrack(payload: Record<string, unknown>) {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: getSid(), ...payload }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
