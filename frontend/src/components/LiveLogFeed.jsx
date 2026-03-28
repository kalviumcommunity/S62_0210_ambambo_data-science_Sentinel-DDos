/**
 * LiveLogFeed — terminal-style scrolling log panel.
 * Auto-scrolls to the bottom on new lines.
 * Color-coded by level: INFO=cyan, WARN=yellow, ERROR=red.
 */
import { useEffect, useRef } from 'react'
import { useSentinel } from '../context/SentinelContext'

const LEVEL_STYLE = {
  INFO:  { tag: 'text-cyan-400',   line: 'text-slate-400' },
  WARN:  { tag: 'text-yellow-400', line: 'text-yellow-200/80' },
  ERROR: { tag: 'text-red-400',    line: 'text-red-300/90' },
}

function LogLine({ entry, isNewest }) {
  const cfg = LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.INFO
  const time = formatTime(entry.ts)

  return (
    <div
      className={`flex items-start gap-2 px-4 py-0.5 leading-5 text-[11px]
        ${isNewest ? 'animate-[fadeSlideIn_0.2s_ease_both]' : ''}`}
    >
      {/* Timestamp */}
      <span className="flex-shrink-0 text-slate-600 tabular-nums select-none"
            style={{ fontFamily: 'var(--font-mono)' }}>
        {time}
      </span>

      {/* Level badge */}
      <span className={`flex-shrink-0 font-bold w-[38px] text-right ${cfg.tag} uppercase select-none`}
            style={{ fontFamily: 'var(--font-mono)' }}>
        {entry.level}
      </span>

      {/* Message */}
      <span className={`flex-1 min-w-0 break-all ${cfg.line}`}
            style={{ fontFamily: 'var(--font-mono)' }}>
        {entry.message}
      </span>
    </div>
  )
}

export default function LiveLogFeed() {
  const { logs } = useSentinel()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const isAtBottomRef = useRef(true)

  // Track whether user has scrolled up (suspend auto-scroll)
  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const tolerance = 40
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < tolerance
  }

  // Auto-scroll to bottom only when user hasn't scrolled up
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [logs])

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                style={{ fontFamily: 'var(--font-mono)' }}>
            Event Log
          </span>
          <span className="text-[10px] text-slate-600 tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}>
            {logs.length} lines
          </span>
        </div>

        {/* Level legend */}
        <div className="flex items-center gap-3">
          {Object.entries(LEVEL_STYLE).map(([k, v]) => (
            <span key={k} className={`text-[9px] uppercase tracking-wider ${v.tag}`}
                  style={{ fontFamily: 'var(--font-mono)' }}>
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Log body */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto py-2 min-h-[140px] max-h-[220px]"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-700">
            <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              Awaiting events…
            </span>
          </div>
        ) : (
          <>
            {logs.map((entry, i) => (
              <LogLine key={i} entry={entry} isNewest={i === logs.length - 1} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  )
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return isNaN(d) ? '--:--:--' : d.toLocaleTimeString('en-GB', { hour12: false })
  } catch { return '--:--:--' }
}
