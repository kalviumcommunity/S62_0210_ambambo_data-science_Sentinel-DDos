import { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import { SentinelProvider } from './context/SentinelContext'
import ToastContainer from './components/ToastContainer'
import { useToast } from './hooks/useToast'

function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toasts, toast, dismiss } = useToast()

  return (
    // SentinelProvider needs toast, so it must be inside AppShell
    <SentinelProvider toast={toast}>
      <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">

        {/* CRT scanline overlay */}
        <div className="scanlines" aria-hidden="true" />

        {/* Navbar */}
        <Navbar onMenuToggle={() => setMobileMenuOpen(o => !o)} />

        {/* Body: sidebar + main */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />

          {/* Scrollable main content */}
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardPage toast={toast} />
          </main>
        </div>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} dismiss={dismiss} />
      </div>
    </SentinelProvider>
  )
}

export default function App() {
  return <AppShell />
}