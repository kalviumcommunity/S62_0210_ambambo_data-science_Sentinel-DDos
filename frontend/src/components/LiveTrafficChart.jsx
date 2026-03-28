/**
 * LiveTrafficChart — rolling area chart of attack vs normal traffic.
 * Uses isAnimationActive={false} for smooth live updates without re-animation.
 */
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useSentinel } from '../context/SentinelContext'

const TICK_STYLE = {
  fill: '#64748b',
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-[11px] shadow-xl"
      style={{ fontFamily: 'var(--font-mono)' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold ml-auto" style={{ color: p.color }}>
            {formatBps(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>
    </div>
  )
}

export default function LiveTrafficChart() {
  const { trafficHistory } = useSentinel()

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
              style={{ fontFamily: 'var(--font-mono)' }}>
            Traffic Analysis
          </h3>
          <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            Rolling window · last {trafficHistory.length} events
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          {trafficHistory.length > 0 && (
            <span className="blink w-1.5 h-1.5 rounded-full bg-green-400
              shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
          )}
          <span className="text-[9px] uppercase tracking-widest text-slate-500"
                style={{ fontFamily: 'var(--font-mono)' }}>
            {trafficHistory.length > 0 ? 'Live' : 'Waiting'}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[160px]">
        {trafficHistory.length === 0 ? (
          <EmptyState label="Waiting for traffic data…" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAttack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f87171" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

              <XAxis
                dataKey="time"
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => formatBps(v, true)}
                width={48}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(val) => (
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-mono)' }}>
                    {val}
                  </span>
                )}
              />

              <Area
                type="monotone"
                dataKey="normalTraffic"
                name="Normal"
                stroke="#22d3ee"
                strokeWidth={1.5}
                fill="url(#gradNormal)"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="attackTraffic"
                name="Attack"
                stroke="#f87171"
                strokeWidth={1.5}
                fill="url(#gradAttack)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Format bytes/sec ───────────────────────────────────────────
function formatBps(v, short = false) {
  if (!v || v === 0) return short ? '0' : '0 B/s'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}${short ? '' : ' '}GB/s`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}${short ? '' : ' '}MB/s`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}${short ? '' : ' '}KB/s`
  return `${v.toFixed(0)}${short ? '' : ' B/s'}`
}
