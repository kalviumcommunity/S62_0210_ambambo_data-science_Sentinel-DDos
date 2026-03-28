/**
 * ToastContainer — renders in-app notification toasts.
 * Receives toasts array + dismiss handler from App.jsx.
 */

const typeStyle = {
  info:    { bar: 'bg-cyan-400',   icon: 'ℹ', text: 'text-cyan-300' },
  success: { bar: 'bg-green-400',  icon: '✓', text: 'text-green-300' },
  warning: { bar: 'bg-yellow-400', icon: '⚠', text: 'text-yellow-300' },
  error:   { bar: 'bg-red-500',    icon: '✕', text: 'text-red-300' },
}

export default function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const cfg = typeStyle[t.type] ?? typeStyle.info
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm
              bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden
              animate-[fadeSlideIn_0.25s_ease_both]"
            role="alert"
          >
            {/* Accent bar */}
            <div className={`w-1 self-stretch flex-shrink-0 ${cfg.bar} opacity-80`} />

            {/* Icon + message */}
            <div className="flex items-start gap-2.5 py-3 pr-3 flex-1 min-w-0">
              <span className={`text-base leading-none mt-0.5 ${cfg.text}`} aria-hidden>
                {cfg.icon}
              </span>
              <span
                className="text-xs text-slate-300 leading-relaxed break-words"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t.message}
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(t.id)}
              className="self-start mt-2.5 mr-2 text-slate-600 hover:text-slate-400
                transition-colors text-sm leading-none"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
