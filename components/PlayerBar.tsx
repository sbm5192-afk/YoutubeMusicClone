'use client'
import { usePlayer } from './PlayerContext'
import { Icon } from './Icons'

const fmt = (t: number) => {
  const s = Math.floor(t || 0)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function PlayerBar() {
  const p = usePlayer()
  const s = p.current
  if (!s) return null
  const liked = p.liked.has(s.id)
  return (
    <div className="bar">
      <input
        type="range"
        min={0}
        max={Math.max(p.duration, 1)}
        step={1}
        value={Math.min(p.progress, p.duration || 0)}
        onChange={(e) => p.seek(Number(e.target.value))}
        aria-label="Seek"
      />
      <div className="bar-main">
        <button className="bar-song" onClick={() => p.setExpanded(true)} aria-label="Open now playing">
          <div className="bar-cover">{s.thumb && <img src={s.thumb} alt="" referrerPolicy="no-referrer" />}</div>
          <div className="bar-text">
            <div className="bar-title">{s.title}</div>
            <div className="bar-artist">{s.artist}</div>
          </div>
        </button>
        <div className="bar-ctrl">
          <button onClick={p.prev} aria-label="Previous">
            <Icon name="prev" />
          </button>
          <button className="big" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}>
            <Icon name={p.playing ? 'pause' : 'play'} />
          </button>
          <button onClick={p.next} aria-label="Next">
            <Icon name="next" />
          </button>
        </div>
        <span className="time">
          {fmt(p.progress)} / {fmt(p.duration)}
        </span>
        <button
          className={'bar-ctrl like' + (liked ? ' liked' : '')}
          onClick={() => p.toggleLike(s)}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Icon name="heart" outline={!liked} />
        </button>
        <button className="bar-ctrl" onClick={() => p.setExpanded(!p.expanded)} aria-label="Expand">
          <Icon name={p.expanded ? 'down' : 'up'} outline />
        </button>
      </div>
    </div>
  )
}
