import { useState } from 'react'

// ── Inline SVG icons ────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  threats: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  logs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  network: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M10.54 17.22a6 6 0 0 1 2.93 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  ),
  geo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  rules: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  ),
  chevronRight: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', accent: 'cyan'   },
  { id: 'threats',   label: 'Threats',   icon: 'threats',   accent: 'red',   badge: 14 },
  { id: 'logs',      label: 'Logs',      icon: 'logs',      accent: 'yellow' },
  { id: 'network',   label: 'Network',   icon: 'network',   accent: 'cyan'   },
  { id: 'geo',       label: 'Geo Intel', icon: 'geo',       accent: 'green'  },
  { id: 'rules',     label: 'Rulesets',  icon: 'rules',     accent: 'green'  },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const [active, setActive]       = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const handleNav = (id) => {
    setActive(id)
    onClose?.()           // close on mobile after nav
  }

  // ── Shared inner content ──────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">

      {/* Collapse toggle (desktop only) */}
      <div className={`hidden lg:flex mb-2 ${collapsed ? 'justify-center px-2' : 'justify-end px-3'}`}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center w-6 h-6
            rounded bg-slate-800 border border-slate-700 text-slate-500
            hover:text-slate-300 hover:border-slate-600 transition-colors"
          aria-label="Collapse sidebar"
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map(({ id, label, icon, accent, badge }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              title={collapsed ? label : undefined}
              className={`nav-link ${isActive ? `active ${accent}` : ''}`}
            >
              <span className="flex-shrink-0 w-4 h-4">
                {icons[icon]}
              </span>

              {/* Label — hidden when collapsed on desktop */}
              {(!collapsed) && (
                <span style={{ fontFamily: 'var(--font-display)' }}
                  className="flex-1 text-left">
                  {label}
                </span>
              )}

              {/* Badge */}
              {badge && !collapsed && (
                <span style={{ fontFamily: 'var(--font-mono)' }}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    bg-red-500/15 text-red-400 border border-red-500/25">
                  {badge}
                </span>
              )}

              {/* Collapsed badge dot */}
              {badge && collapsed && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full
                  bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="my-3 mx-4 h-px bg-slate-800" />

      {/* Footer nav */}
      <div className="px-2 flex flex-col gap-1">
        <button
          title={collapsed ? 'Settings' : undefined}
          className="nav-link"
        >
          <span className="flex-shrink-0 w-4 h-4">{icons.settings}</span>
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-display)' }}>Settings</span>
          )}
        </button>

        {/* Version tag */}
        {!collapsed && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] text-slate-600 uppercase tracking-widest">
              Engine v2.4.1
            </p>
            <p style={{ fontFamily: 'var(--font-mono)' }}
              className="text-[10px] text-green-500/70 mt-0.5">
              ● All systems nominal
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 border-r border-slate-800
          bg-slate-900 transition-all duration-250 overflow-hidden`}
        style={{ width: collapsed ? '56px' : '200px' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-56
          bg-slate-900 border-r border-slate-800 flex flex-col
          transition-transform duration-250 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800">
          <span style={{ fontFamily: 'var(--font-mono)' }}
            className="text-xs text-slate-400 uppercase tracking-widest">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  )
}