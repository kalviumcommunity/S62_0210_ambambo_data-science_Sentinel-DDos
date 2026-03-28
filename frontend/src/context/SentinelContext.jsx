import { createContext, useContext, useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'

const SentinelContext = createContext(null)

export function SentinelProvider({ children, toast }) {
  const socket = useSocket()

  // Surface connection state changes as toasts
  useEffect(() => {
    if (socket.connected) {
      toast.success('Connected to Sentinel backend')
    }
  }, [socket.connected]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (socket.reconnecting) {
      toast.warning('Connection lost — reconnecting…')
    }
  }, [socket.reconnecting]) // eslint-disable-line react-hooks/exhaustive-deps

  // Surface high-severity threats as toasts
  useEffect(() => {
    const latest = socket.threats[0]
    if (!latest) return
    if (latest.severity === 'high') {
      toast.error(`🚨 ${latest.attack_type} detected from ${latest.src_ip}`)
    }
  }, [socket.threats]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SentinelContext.Provider value={socket}>
      {children}
    </SentinelContext.Provider>
  )
}

// Typed accessor — throws if used outside provider
export function useSentinel() {
  const ctx = useContext(SentinelContext)
  if (!ctx) throw new Error('useSentinel must be used inside <SentinelProvider>')
  return ctx
}
