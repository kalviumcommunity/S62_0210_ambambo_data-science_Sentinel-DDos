/**
 * DashboardPage — fully live. Zero static/mock data.
 * All values arrive via SentinelContext (Socket.IO).
 */
import { useSentinel } from '../context/SentinelContext'
import StatsGrid from '../components/StatsGrid'
import LiveTrafficChart from '../components/LiveTrafficChart'
import ThreatPanel from '../components/ThreatPanel'
import LiveLogFeed from '../components/LiveLogFeed'
import FileUpload from '../components/FileUpload'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ── Attack-type distribution chart ─────────────────────────────
function AttackDistributionChart({ threats }) {
  if (threats.length === 0) return null

  // Count occurrences per attack_type
  const counts = threats.reduce((acc, t) => {
    const k = t.attack_type ?? 'UNKNOWN'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) // top 8 types

  const COLORS = ['#f87171','#fb923c','#facc15','#a78bfa','#60a5fa','#34d399','#f472b6','#94a3b8']

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 mb-4"
          style={{ fontFamily: 'var(--font-mono)' }}>
        Attack Type Distribution
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                 tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={80}
                 tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                 tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            isAnimationActive={false}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Safety Score Card ───────────────────────────────────────────
function SafetyScore({ fileStats }) {
  if (!fileStats) return null

  const pct    = fileStats.safe_percentage ?? 100
  const color  = pct >= 80 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171'
  const label  = pct >= 80 ? 'Safe' : pct >= 50 ? 'Elevated Risk' : 'Under Attack'
  const radius = 40
  const circ   = 2 * Math.PI * radius
  const offset = circ * (1 - pct / 100)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 flex flex-col items-center gap-3">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 self-start"
          style={{ fontFamily: 'var(--font-mono)' }}>
        Safety Score
      </h3>

      {/* Donut */}
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="50" y="45" textAnchor="middle" fill={color}
              style={{ fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {pct}%
        </text>
        <text x="50" y="60" textAnchor="middle" fill="#64748b"
              style={{ fontSize: 8, fontFamily: 'var(--font-mono)' }}>
          SAFE
        </text>
      </svg>

      <span className="text-xs font-medium" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {label}
      </span>

      {/* Processed rows */}
      <div className="w-full grid grid-cols-2 gap-2 text-center mt-1">
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Total</p>
          <p className="text-sm font-bold text-slate-300 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            {(fileStats.processed_rows ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Attacks</p>
          <p className="text-sm font-bold text-red-400 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            {(fileStats.attack_rows ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Stream progress bar ─────────────────────────────────────────
function StreamProgress({ streamStatus }) {
  if (!streamStatus.isStreaming && streamStatus.progress === 0) return null

  const { progress, isPaused, totalRows } = streamStatus
  const color = isPaused ? '#facc15' : '#22d3ee'

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/60 rounded-lg border border-slate-700/50">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPaused ? 'bg-yellow-400' : 'bg-cyan-400 blink'}
        shadow-[0_0_5px_var(--c)]`} style={{ '--c': color }} />
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-slate-500 flex-shrink-0"
            style={{ fontFamily: 'var(--font-mono)' }}>
        {progress}% {totalRows > 0 && `· ${totalRows.toLocaleString()} rows`}
      </span>
    </div>
  )
}

// ── Build live stats for StatsGrid ─────────────────────────────
function buildLiveStats(fileStats, trafficHistory) {
  const latest    = trafficHistory[trafficHistory.length - 1]
  const totalBps  = latest?.totalTraffic  ?? 0
  const attackBps = latest?.attackTraffic ?? 0
  const normalBps = latest?.normalTraffic ?? 0

  const spark = trafficHistory.slice(-12).map(p => p.totalTraffic ?? 0)
  const sparkA = trafficHistory.slice(-12).map(p => p.attackTraffic ?? 0)
  const sparkN = trafficHistory.slice(-12).map(p => p.normalTraffic ?? 0)

  return [
    {
      id: 'total',
      title: 'Total Traffic',
      value: formatBpsShort(totalBps),
      type: 'total',
      sublabel: 'current rate',
      sparkline: spark,
    },
    {
      id: 'attack',
      title: 'Attack Traffic',
      value: formatBpsShort(attackBps),
      type: 'attack',
      sublabel: 'malicious rate',
      sparkline: sparkA,
    },
    {
      id: 'normal',
      title: 'Normal Traffic',
      value: formatBpsShort(normalBps),
      type: 'normal',
      sublabel: 'legitimate rate',
      sparkline: sparkN,
    },
    {
      id: 'safe',
      title: 'Safe Packets',
      value: fileStats ? `${fileStats.safe_percentage ?? 100}` : '—',
      unit: fileStats ? '%' : '',
      type: (fileStats?.safe_percentage ?? 100) >= 80 ? 'normal'
           : (fileStats?.safe_percentage ?? 100) >= 50 ? 'warning'
           : 'attack',
      sublabel: fileStats ? `${(fileStats.normal_rows ?? 0).toLocaleString()} / ${(fileStats.processed_rows ?? 0).toLocaleString()} rows` : 'upload to analyse',
    },
  ]
}

// ── Page ────────────────────────────────────────────────────────
export default function DashboardPage({ toast }) {
  const { trafficHistory, threats, fileStats, streamStatus } = useSentinel()

  const liveStats = buildLiveStats(fileStats, trafficHistory)
  const hasData   = trafficHistory.length > 0 || threats.length > 0

  return (
    <div className="page-enter flex flex-col gap-5 max-w-screen-xl">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">
            Threat Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {hasData
              ? <>Last event: <span className="text-cyan-400">live</span></>
              : 'Upload a dataset to begin real-time analysis'}
          </p>
        </div>
      </div>

      {/* ── File Upload + stream progress ── */}
      <div className="flex flex-col gap-2">
        <FileUpload toast={toast} />
        <StreamProgress streamStatus={streamStatus} />
      </div>

      {/* ── Stats Grid ── */}
      <StatsGrid stats={liveStats} columns={4} />

      {/* ── Charts + Threat Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Traffic Area Chart — 2/3 width */}
        <div className="lg:col-span-2 min-h-[260px]">
          <LiveTrafficChart />
        </div>

        {/* Right column: Safety Score + Attack Distribution */}
        <div className="flex flex-col gap-4">
          <SafetyScore fileStats={fileStats} />
          <AttackDistributionChart threats={threats} />
        </div>
      </div>

      {/* ── Threat Panel + Log Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-h-[300px]">
          <ThreatPanel />
        </div>
        <LiveLogFeed />
      </div>
    </div>
  )
}

// ── Formatting ─────────────────────────────────────────────────
function formatBpsShort(v) {
  if (!v || v === 0) return '0'
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} GB`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} MB`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)} KB`
  return `${Math.round(v)} B`
}