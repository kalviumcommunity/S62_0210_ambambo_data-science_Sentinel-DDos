import { useSentinel } from '../context/SentinelContext'

const states = {
  connected:    { dot: 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]', text: 'text-green-400', label: 'Connected' },
  reconnecting: { dot: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.9)]', text: 'text-yellow-400', label: 'Reconnecting' },
  offline:      { dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]',   text: 'text-red-400',   label: 'Offline' },
}

export default function ConnectionStatus() {
  const { connected, reconnecting } = useSentinel()

  const key = connected ? 'connected' : reconnecting ? 'reconnecting' : 'offline'
  const cfg = states[key]
  const isBlinking = !connected

  return (
    <div
      className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full
        bg-slate-800/60 border border-slate-700/60"
    >
      <span
        className={`w-2 h-2 rounded-full ${cfg.dot} ${isBlinking ? 'blink' : ''}`}
      />
      <span
        className={`text-[11px] tracking-widest uppercase ${cfg.text}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {cfg.label}
      </span>
    </div>
  )
}
