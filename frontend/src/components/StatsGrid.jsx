/**
 * StatsGrid — renders a responsive grid of StatCard components.
 * No DEFAULT_STATS here — all data must flow in from the live context.
 * DashboardPage builds and passes the `stats` array every render.
 */
import StatCard from './Statcard'

const COLUMN_CLASS = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
}

export default function StatsGrid({ stats = [], columns = 4 }) {
  const colClass = COLUMN_CLASS[columns] ?? 'lg:grid-cols-4'

  return (
    <section aria-label="Key metrics" className="flex flex-col gap-3">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <h2
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Key Metrics
        </h2>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${colClass} gap-4`}>
        {stats.map((stat, idx) => (
          <div
            key={stat.id ?? idx}
            className="opacity-0 animate-[fadeSlideIn_0.35s_ease_forwards]"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              type={stat.type}
              delta={stat.delta}
              sublabel={stat.sublabel}
              sparkline={stat.sparkline}
            />
          </div>
        ))}
      </div>
    </section>
  )
}