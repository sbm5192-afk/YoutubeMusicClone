let probe: Promise<boolean> | null = null

// One shared reachability probe: can this visitor's network reach YouTube at all?
export function checkYt(): Promise<boolean> {
  if (!probe) {
    probe = new Promise<boolean>((resolve) => {
      const ctrl = new AbortController()
      const t = setTimeout(() => {
        ctrl.abort()
        resolve(false)
      }, 5000)
      fetch('https://www.youtube.com/favicon.ico', { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
        .then(() => {
          clearTimeout(t)
          resolve(true)
        })
        .catch(() => {
          clearTimeout(t)
          resolve(false)
        })
    })
  }
  return probe
}
