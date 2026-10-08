// Only allow redirects to paths inside this site
export function safeNext(v: string | null | undefined, fallback = '/'): string {
  if (!v) return fallback
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return fallback
  return v
}
