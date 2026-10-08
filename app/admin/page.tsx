import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin · Ekko Music' }

type Row = Record<string, any>

const nf = new Intl.NumberFormat('en-US')
const num = (v: any) => nf.format(Number(v ?? 0))
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Tehran', dateStyle: 'medium', timeStyle: 'short' }) : '-'

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}
function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...Array.from(code).map((c) => 127397 + c.charCodeAt(0)))
}

function Kpi({ label, value, sub, live = false }: { label: string; value: string; sub?: string; live?: boolean }) {
  return (
    <div className={'adm-kpi' + (live ? ' live' : '')}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  )
}

function Share({
  title,
  rows,
  valueKey = 'visitors',
  render,
}: {
  title: string
  rows: Row[]
  valueKey?: string
  render?: (r: Row) => string
}) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey] ?? 0)))
  return (
    <section className="adm-card">
      <h3>{title}</h3>
      {rows.length === 0 && <p className="adm-empty">No data yet</p>}
      {rows.map((r, i) => (
        <div className="adm-bar" key={i}>
          <span className="l" title={render ? render(r) : String(r.label)}>
            {render ? render(r) : String(r.label)}
          </span>
          <span className="b">
            <i style={{ width: `${(Number(r[valueKey] ?? 0) / max) * 100}%` }} />
          </span>
          <span className="n">{num(r[valueKey])}</span>
        </div>
      ))}
    </section>
  )
}

function Hourly({ rows }: { rows: Row[] }) {
  const map = new Map<number, number>(rows.map((r) => [Number(r.hour), Number(r.events)]))
  const vals = Array.from({ length: 24 }, (_, h) => map.get(h) ?? 0)
  const max = Math.max(1, ...vals)
  return (
    <div className="adm-hours">
      {vals.map((v, h) => (
        <div key={h} className="hc" title={`${h}:00 - ${v} events`}>
          <i style={{ height: `${(v / max) * 100}%` }} />
          <span>{h % 3 === 0 ? h : ''}</span>
        </div>
      ))}
    </div>
  )
}

function DailyChart({ rows, days }: { rows: Row[]; days: number }) {
  const map = new Map<string, Row>(rows.map((r) => [String(r.day), r]))
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' })
  const now = Date.now()
  const out: { day: string; views: number; visitors: number; plays: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = fmt.format(new Date(now - i * 86400000))
    const r = map.get(key)
    out.push({ day: key, views: Number(r?.views ?? 0), visitors: Number(r?.visitors ?? 0), plays: Number(r?.plays ?? 0) })
  }
  const W = 900
  const H = 230
  const pad = 28
  const max = Math.max(1, ...out.map((d) => Math.max(d.views, d.visitors, d.plays)))
  const bw = (W - pad * 2) / out.length
  const x = (i: number) => pad + bw * i + bw / 2
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2)
  const line = (k: 'visitors' | 'plays') => out.map((d, i) => `${x(i)},${y(d[k])}`).join(' ')
  const grid = [0, 0.25, 0.5, 0.75, 1]
  return (
    <>
      <svg className="adm-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily traffic">
        {grid.map((g) => (
          <g key={g}>
            <line x1={pad} x2={W - pad} y1={y(max * g)} y2={y(max * g)} stroke="rgba(255,255,255,.07)" />
            <text x={4} y={y(max * g) + 4}>
              {Math.round(max * g)}
            </text>
          </g>
        ))}
        {out.map((d, i) => (
          <rect
            key={d.day}
            x={x(i) - Math.max(1, bw * 0.32)}
            y={y(d.views)}
            width={Math.max(2, bw * 0.64)}
            height={Math.max(0, H - pad - y(d.views))}
            rx={2}
            fill="rgba(124,92,255,.55)"
          >
            <title>{`${d.day}: ${d.views} views, ${d.visitors} visitors, ${d.plays} plays`}</title>
          </rect>
        ))}
        <polyline points={line('visitors')} fill="none" stroke="#ff3b6b" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={line('plays')} fill="none" stroke="#4cc9f0" strokeWidth="2.5" strokeLinejoin="round" />
        <text x={pad} y={H - 6}>{out[0]?.day}</text>
        <text x={W / 2 - 30} y={H - 6}>{out[Math.floor(out.length / 2)]?.day}</text>
        <text x={W - pad - 62} y={H - 6}>{out[out.length - 1]?.day}</text>
      </svg>
      <div className="adm-legend">
        <span style={{ ['--c' as any]: 'rgba(124,92,255,.8)' }}>Page views</span>
        <span style={{ ['--c' as any]: '#ff3b6b' }}>Visitors</span>
        <span style={{ ['--c' as any]: '#4cc9f0' }}>Plays</span>
      </div>
    </>
  )
}

export default async function AdminPage({ searchParams }: { searchParams: { days?: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>No access</h1>
          <p className="auth-sub">
            You are signed in as {user.email}, but this account is not an administrator of the site.
          </p>
          <Link href="/" className="btn wide">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const requested = Number(searchParams.days)
  const days = [7, 30, 90].includes(requested) ? requested : 30
  const { data, error } = await supabase.rpc('admin_stats', { p_days: days })
  if (error || !data) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Could not load statistics</h1>
          <p className="auth-sub">{error?.message ?? 'The statistics function returned nothing.'}</p>
        </div>
      </div>
    )
  }

  const t: Row = data.totals ?? {}
  const viewsPerVisitor = Number(t.visitors_period) ? (Number(t.views_period) / Number(t.visitors_period)).toFixed(1) : '0'
  const sourceLabel = (s: string) => (s === 'free' ? 'Free (Jamendo)' : s === 'youtube' ? 'YouTube' : s)

  return (
    <div className="adm">
      <div className="adm-head">
        <div>
          <h1>Dashboard</h1>
          <p>All times and days are in Tehran time. Admin pages are not counted as visits.</p>
        </div>
        <div className="adm-range">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/admin?days=${d}`} className={d === days ? 'on' : ''}>
              {d} days
            </Link>
          ))}
        </div>
      </div>

      <h2>Right now and today</h2>
      <div className="adm-kpis">
        <Kpi live label="Online now" value={num(t.online_now)} sub="active in the last 5 minutes" />
        <Kpi label="Visitors today" value={num(t.visitors_today)} />
        <Kpi label="Page views today" value={num(t.views_today)} />
        <Kpi label="Plays today" value={num(t.plays_today)} />
        <Kpi label="New users today" value={num(t.users_today)} />
      </div>

      <h2>Last {days} days</h2>
      <div className="adm-kpis">
        <Kpi label="Unique visitors" value={num(t.visitors_period)} />
        <Kpi label="Page views" value={num(t.views_period)} sub={`${viewsPerVisitor} per visitor`} />
        <Kpi label="Song plays" value={num(t.plays_period)} />
        <Kpi label="New users" value={num(t.users_period)} />
        <Kpi label="Signed-in visitors" value={num(t.signed_in_visitors)} />
      </div>

      <section className="adm-card wide">
        <h3>Daily traffic</h3>
        <DailyChart rows={data.daily ?? []} days={days} />
      </section>

      <div className="adm-grid">
        <section className="adm-card">
          <h3>Activity by hour (Tehran time)</h3>
          <Hourly rows={data.hourly ?? []} />
        </section>
        <Share title="Top pages (views)" rows={data.top_pages ?? []} valueKey="views" />
        <Share title="Where plays come from" rows={data.sources ?? []} valueKey="plays" render={(r) => sourceLabel(String(r.label))} />
        <Share title="Top artists (plays)" rows={data.top_artists ?? []} valueKey="plays" />
        <Share
          title="Countries (visitors)"
          rows={data.countries ?? []}
          render={(r) => {
            const c = String(r.label)
            return c === 'Unknown' ? c : `${flag(c)} ${countryName(c)}`.trim()
          }}
        />
        <Share title="Cities (visitors)" rows={data.cities ?? []} />
        <Share title="Devices" rows={data.devices ?? []} />
        <Share title="Browsers" rows={data.browsers ?? []} />
        <Share title="Operating systems" rows={data.os ?? []} />
        <Share title="Traffic sources" rows={data.referrers ?? []} render={(r) => (r.label === 'direct' ? 'Direct / none' : String(r.label))} />
      </div>

      <h2>Top songs</h2>
      <section className="adm-card">
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Song</th>
                <th>Source</th>
                <th>Plays</th>
              </tr>
            </thead>
            <tbody>
              {(data.top_songs ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="sub">
                    No plays recorded yet
                  </td>
                </tr>
              )}
              {(data.top_songs ?? []).map((s: Row, i: number) => (
                <tr key={String(s.song_id) + i}>
                  <td className="n">{i + 1}</td>
                  <td>
                    {s.song_title || s.song_id}
                    <div className="sub">{s.song_artist}</div>
                  </td>
                  <td>
                    <span className={'adm-pill ' + (s.song_source ?? '')}>{sourceLabel(String(s.song_source ?? 'unknown'))}</span>
                  </td>
                  <td className="n">{num(s.plays)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2>All time</h2>
      <div className="adm-kpis">
        <Kpi label="Total page views" value={num(t.views_all)} />
        <Kpi label="Total visitors" value={num(t.visitors_all)} />
        <Kpi label="Total plays" value={num(t.plays_all)} />
        <Kpi label="Registered users" value={num(t.users_total)} />
        <Kpi label="Liked songs" value={num(t.likes_total)} />
      </div>

      <h2>Latest users</h2>
      <section className="adm-card">
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Sign-in method</th>
                <th>Joined</th>
                <th>Last sign-in</th>
                <th>Plays</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent_users ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="sub">
                    No users yet
                  </td>
                </tr>
              )}
              {(data.recent_users ?? []).map((u: Row) => (
                <tr key={u.id}>
                  <td>
                    {u.full_name || String(u.email ?? '').split('@')[0]}
                    <div className="sub">{u.email}</div>
                  </td>
                  <td>
                    <span className="adm-pill">{u.provider}</span>
                  </td>
                  <td>{when(u.created_at)}</td>
                  <td>{u.last_sign_in_at ? when(u.last_sign_in_at) : 'never'}</td>
                  <td className="n">{num(u.plays)}</td>
                  <td className="n">{num(u.likes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2>Live feed</h2>
      <section className="adm-card">
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Details</th>
                <th>Location</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent_events ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="sub">
                    No events yet
                  </td>
                </tr>
              )}
              {(data.recent_events ?? []).map((e: Row, i: number) => (
                <tr key={i}>
                  <td>{when(e.created_at)}</td>
                  <td>
                    <span className="adm-pill">{e.type === 'view' ? 'page view' : 'play'}</span>
                  </td>
                  <td>{e.type === 'play' ? `${e.song_title ?? ''} - ${e.song_artist ?? ''}` : e.path}</td>
                  <td>{e.country ? `${flag(String(e.country))} ${e.country}` : '-'}</td>
                  <td>
                    {e.device} · {e.browser}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
