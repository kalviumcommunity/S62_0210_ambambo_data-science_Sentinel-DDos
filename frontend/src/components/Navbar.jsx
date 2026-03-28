import { useState } from 'react'
import ConnectionStatus from './ConnectionStatus'
import { useSentinel } from '../context/SentinelContext'

// ── Icons ─────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export default function Navbar({ onMenuToggle }) {
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Live threat count from context
  const { threats, connected } = useSentinel()
  const liveThreats = threats.length
  const hasNewThreat = threats[0]?.severity === 'high'

  return (
    <header className="relative z-40 flex items-center justify-between h-14 px-5
      bg-slate-900 border-b border-slate-800">

      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(248,113,113,0.5), transparent)' }}
      />

      {/* ── Left: brand ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-8 h-8
            bg-slate-800 border border-slate-700 rounded-lg text-slate-400
            hover:text-slate-200 hover:border-slate-600 transition-colors"
          aria-label="Toggle sidebar"
        >
          <MenuIcon />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
            bg-red-500/10 border border-red-500/30 text-red-400"
            style={{ boxShadow: '0 0 14px rgba(239,68,68,0.2)' }}>
            <ShieldIcon />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)' }}
              className="text-sm font-bold tracking-widest text-white uppercase leading-none">
              Sentinel
            </h1>
            <span style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[9px] tracking-[0.2em] text-slate-500 uppercase">
              DDoS Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* ── Center: live connection status ── */}
      <ConnectionStatus />

      {/* ── Right: controls ── */}
      <div className="flex items-center gap-3">

        {/* Live threat counter */}
        <div className="hidden sm:flex flex-col items-end leading-none gap-0.5">
          <span style={{ fontFamily: 'var(--font-mono)' }}
            className="text-[9px] text-slate-500 uppercase tracking-[0.15em]">
            Active Threats
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}
            className={`text-lg font-bold tabular-nums transition-colors duration-300
              ${liveThreats > 0 ? 'text-red-400' : 'text-slate-600'}`}>
            {liveThreats}
          </span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-slate-700" />

        {/* Bell — alerts on new high-severity threat */}
        <button
          onClick={() => setAlertDismissed(a => !a)}
          className="relative flex items-center justify-center w-8 h-8
            bg-slate-800 border border-slate-700 rounded-lg text-slate-400
            hover:text-slate-200 hover:border-slate-600 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon />
          {hasNewThreat && !alertDismissed && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500
              shadow-[0_0_6px_rgba(239,68,68,0.9)] blink" />
          )}
        </button>

        {/* ML status indicator */}
        <div
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg
            bg-slate-800 border border-slate-700 text-slate-500"
          title={connected ? 'Backend connected' : 'Backend offline'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={connected ? '#4ade80' : '#64748b'} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
              a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
              A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
              l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
              A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
              l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
              a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
              l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
              a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>

        {/* Avatar */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
          border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide
          cursor-pointer hover:border-cyan-400/50 transition-colors select-none"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(248,113,113,0.12))'
          }}>
          SA
        </div>
      </div>
    </header>
  )
}