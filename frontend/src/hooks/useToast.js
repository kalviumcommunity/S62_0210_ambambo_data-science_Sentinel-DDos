import { useState, useCallback, useRef } from 'react'

let _nextId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id])
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_nextId
    setToasts(prev => [...prev.slice(-4), { id, message, type }]) // max 5 visible

    timersRef.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const toast = {
    info:    (msg, d) => addToast(msg, 'info',    d),
    success: (msg, d) => addToast(msg, 'success', d),
    warning: (msg, d) => addToast(msg, 'warning', d),
    error:   (msg, d) => addToast(msg, 'error',   d),
  }

  return { toasts, toast, dismiss }
}
