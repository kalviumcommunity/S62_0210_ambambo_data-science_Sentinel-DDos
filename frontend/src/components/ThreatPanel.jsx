/**
 * ThreatPanel — real-time list of detected attacks, newest first.
 * Color-coded by severity: red=high, yellow=medium, green=low.
 */
import { useRef, useEffect } from 'react'
import { useSentinel } from '../context/SentinelContext'

const SEV = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/25',       glow: '0 0 8px rgba(239,68,68,0.25)' },
  medium: { dot: 'bg-yellow-400', badge: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25', glow: '0 0 8px rgba(250,204,21,0.2)'  },
  low:    { dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-400 border-green-500/25',   glow: '0 0 8px rgba(74,222,128,0.15)' },
}

const STATUS_COLOR = {
  BLOCKED:    'text-red-400',
  MITIGATING: 'text-yellow-400',
  RESOLVED:   'text-green-400',
}

function ThreatRow({ threat, idx }) {
  const cfg    = SEV[threat.severity] ?? SEV.low
  const prob   = Math.round((threat.probability ?? 0) * 100)
  const time   = formatTime(threat.timestamp)
  const status = threat.status ?? 'BLOCKED'

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b border-slate-800/60
        hover:bg-slate-700/20 transition-colors duration-150
        animate-[fadeSlideIn_0.3s_ease_both]"
      style={{ animationDelay: `${Math.min(idx, 5) * 40}ms`, boxShadow: idx === 0 ? cfg.glow : undefined }}
    >
      {/* Severity dot */}
      <div className="flex-shrink-0 mt-1">
        <span className={`block w-2 h-2 rounded-full ${cfg.dot} ${idx === 0 ? 'blink' : ''}`} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: type + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
              font-bold uppercase tracking-wide border ${cfg.badge}`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {threat.attack_type ?? 'UNKNOWN'}
          </span>

          <span
            className={`text-[10px] font-medium uppercase tracking-wide ${STATUS_COLOR[status] ?? 'text-slate-500'}`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {status}
          </span>
        </div>

        {/* Row 2: src IP */}
        <p
          className="text-xs text-slate-300 mt-1 font-medium truncate"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {threat.src_ip ?? '—'}
          {threat.dst_ip && threat.dst_ip !== '0.0.0.0' && (
            <span className="text-slate-600"> → {threat.dst_ip}</span>
          )}
        </p>

        {/* Row 3: probability + protocol */}
        <div className="flex items-center gap-3 mt-1">
          {/* Prob bar */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden max-w-[80px]">
              <div
                className={`h-full rounded-full ${prob >= 80 ? 'bg-red-400' : prob >= 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${prob}%` }}
              />
            </div>
            <span
              className="text-[10px] tabular-nums text-slate-500"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {prob}%
            </span>
          </div>

          {threat.protocol && (
            <span className="text-[9px] text-slate-600 uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-mono)' }}>
              {threat.protocol}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <span
        className="flex-shrink-0 text-[9px] text-slate-600 mt-0.5 tabular-nums"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {time}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-700">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
        No threats detected
      </span>
    </div>
  )
}

export default function ThreatPanel() {
  const { threats } = useSentinel()
  const listRef     = useRef(null)

  // Auto-scroll is NOT used here — newest-first list keeps latest at top
  // (scroll would fight the user when they try to read older entries)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700/50 flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                style={{ fontFamily: 'var(--font-mono)' }}>
            Active Threats
          </span>
          {threats.length > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded
                bg-red-500/10 text-red-400 border border-red-500/25"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {threats.length}
            </span>
          )}
        </div>

        {/* Severity legend */}
        <div className="flex items-center gap-2.5">
          {Object.entries({ high: 'bg-red-500', medium: 'bg-yellow-400', low: 'bg-green-500' }).map(([k, cls]) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${cls}`} />
              <span className="text-[9px] text-slate-600 uppercase"
                    style={{ fontFamily: 'var(--font-mono)' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {threats.length === 0 ? (
          <EmptyState />
        ) : (
          threats.map((t, idx) => (
            <ThreatRow key={t.id} threat={t} idx={idx} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function formatTime(iso) {
  try {
    const d = new Date(iso)
    if (isNaN(d)) return '--:--:--'
    return d.toLocaleTimeString('en-GB', { hour12: false })
  } catch {
    return '--:--:--'
  }
}
