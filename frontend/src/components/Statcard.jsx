import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

// ── Color config by type ────────────────────────────────────
const typeConfig = {
  total: {
    text:       'text-cyan-400',
    border:     'border-cyan-500/30',
    iconBg:     'bg-cyan-500/10',
    iconColor:  'text-cyan-400',
    glow:       '0 0 24px rgba(34,211,238,0.12)',
    bar:        'bg-cyan-400',
    Icon:       Activity,
  },
  attack: {
    text:       'text-red-400',
    border:     'border-red-500/30',
    iconBg:     'bg-red-500/10',
    iconColor:  'text-red-400',
    glow:       '0 0 24px rgba(248,113,113,0.12)',
    bar:        'bg-red-400',
    Icon:       ShieldAlert,
  },
  normal: {
    text:       'text-green-400',
    border:     'border-green-500/30',
    iconBg:     'bg-green-500/10',
    iconColor:  'text-green-400',
    glow:       '0 0 24px rgba(74,222,128,0.12)',
    bar:        'bg-green-400',
    Icon:       ShieldCheck,
  },
  warning: {
    text:       'text-yellow-400',
    border:     'border-yellow-500/30',
    iconBg:     'bg-yellow-500/10',
    iconColor:  'text-yellow-400',
    glow:       '0 0 24px rgba(250,204,21,0.12)',
    bar:        'bg-yellow-400',
    Icon:       Zap,
  },
}

// ── Delta badge ─────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === undefined || delta === null) return null

  const isUp      = delta > 0
  const isNeutral = delta === 0

  const Icon  = isNeutral ? Minus : isUp ? TrendingUp : TrendingDown
  const color = isNeutral
    ? 'text-slate-400 bg-slate-700/60 border-slate-600/40'
    : isUp
      ? 'text-red-400 bg-red-500/10 border-red-500/25'
      : 'text-green-400 bg-green-500/10 border-green-500/25'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md
        border text-[11px] font-medium ${color}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {isNeutral ? '0%' : `${isUp ? '+' : ''}${delta}%`}
    </span>
  )
}

// ── StatCard ─────────────────────────────────────────────────
/**
 * Props:
 *   title     {string}             — card label
 *   value     {string|number}      — main metric
 *   unit      {string}             — optional unit suffix (e.g. "Gbps", "K")
 *   type      {'total'|'attack'|'normal'|'warning'}
 *   delta     {number}             — % change vs previous period (optional)
 *   sublabel  {string}             — small helper text below value (optional)
 *   sparkline {number[]}           — mini bar chart data (optional, 8–12 values)
 */
export default function StatCard({
  title    = 'Metric',
  value    = '—',
  unit,
  type     = 'total',
  delta,
  sublabel,
  sparkline,
}) {
  const cfg = typeConfig[type] ?? typeConfig.total
  const { Icon } = cfg

  // Normalise sparkline to 0-100 range for bar heights
  const bars = (() => {
    if (!sparkline?.length) return []
    const max = Math.max(...sparkline, 1)
    return sparkline.map(v => Math.round((v / max) * 100))
  })()

  return (
    <article
      className={`relative group bg-slate-800 rounded-xl border shadow-lg
        overflow-hidden cursor-default select-none
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-xl hover:-translate-y-0.5
        ${cfg.border}`}
      style={{ boxShadow: cfg.glow }}
    >
      {/* Subtle inner gradient sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-60"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 55%)',
        }}
      />

      {/* Accent bar along the top edge */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.bar} opacity-70`} />

      {/* Card body */}
      <div className="relative px-5 pt-5 pb-4 flex flex-col gap-3">

        {/* ── Row 1: title + icon ── */}
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 leading-none"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {title}
          </p>
          <div
            className={`flex-shrink-0 flex items-center justify-center
              w-8 h-8 rounded-lg ${cfg.iconBg} ${cfg.iconColor}`}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        </div>

        {/* ── Row 2: value ── */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-3xl font-bold leading-none tracking-tight ${cfg.text}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {value}
          </span>
          {unit && (
            <span
              className="text-sm text-slate-500 font-medium"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* ── Row 3: delta + sublabel ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <DeltaBadge delta={delta} />
          {sublabel && (
            <span
              className="text-[11px] text-slate-500 leading-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {sublabel}
            </span>
          )}
        </div>

        {/* ── Row 4: sparkline (optional) ── */}
        {bars.length > 0 && (
          <div className="flex items-end gap-0.5 h-8 mt-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${cfg.bar} opacity-50
                  group-hover:opacity-70 transition-opacity duration-200`}
                style={{ height: `${h}%`, minHeight: '2px' }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}