/**
 * useSocket — central hook for all real-time data from the backend.
 *
 * Manages the Socket.IO connection lifecycle and maintains rolling
 * state windows for charts, threats, and logs.
 *
 * Returns read-only data + action callbacks (no component renders here).
 */
import { useEffect, useRef, useCallback, useReducer } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL         = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
const MAX_TRAFFIC_POINTS = 80    // rolling chart window
const MAX_THREATS        = 50    // newest-first threat list
const MAX_LOGS           = 200   // log line buffer

// ── State shape ──────────────────────────────────────────────
const initialState = {
  connected:      false,
  reconnecting:   false,
  trafficHistory: [],   // [{ time, totalTraffic, attackTraffic, normalTraffic, packetRate }]
  threats:        [],   // [{ id, src_ip, attack_type, severity, probability, timestamp, ... }]
  logs:           [],   // [{ ts, level, message }]
  fileStats:      null, // { total_rows, attack_rows, normal_rows, safe_percentage, processed_rows }
  streamStatus:   { progress: 0, isStreaming: false, isPaused: false, totalRows: 0 },
  mlStatus:       { available: null }, // null = unknown
}

// ── Reducer ──────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: true, reconnecting: false }

    case 'DISCONNECTED':
      return { ...state, connected: false }

    case 'RECONNECTING':
      return { ...state, reconnecting: true }

    case 'TRAFFIC_UPDATE': {
      const point = {
        ...action.payload,
        time: formatTime(action.payload.timestamp),
      }
      const next = [...state.trafficHistory, point]
      return { ...state, trafficHistory: next.slice(-MAX_TRAFFIC_POINTS) }
    }

    case 'THREAT_DETECTED': {
      const next = [action.payload, ...state.threats].slice(0, MAX_THREATS)
      return { ...state, threats: next }
    }

    case 'LOG_LINE': {
      const next = [...state.logs, action.payload].slice(-MAX_LOGS)
      return { ...state, logs: next }
    }

    case 'FILE_STATS':
      return { ...state, fileStats: action.payload }

    case 'STREAM_STATUS':
      return { ...state, streamStatus: { ...state.streamStatus, ...action.payload } }

    case 'ML_STATUS':
      return { ...state, mlStatus: action.payload }

    case 'RESET':
      return {
        ...initialState,
        connected:    state.connected,
        reconnecting: state.reconnecting,
      }

    default:
      return state
  }
}

// ── Hook ─────────────────────────────────────────────────────
export function useSocket() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnectionDelayMax: 5_000,
      reconnectionAttempts: Infinity,
    })
    socketRef.current = socket

    // ── Connection lifecycle ──────────────────────────────────
    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED' })
      // Ask server for current stream state on (re)connect
      socket.emit('state:sync')
      socket.emit('ml:ping')
    })

    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }))

    socket.on('connect_error', () => dispatch({ type: 'RECONNECTING' }))

    // ── Data events ───────────────────────────────────────────
    socket.on('traffic:update', (data) =>
      dispatch({ type: 'TRAFFIC_UPDATE', payload: data })
    )

    socket.on('threat:detected', (data) =>
      dispatch({ type: 'THREAT_DETECTED', payload: data })
    )

    socket.on('log:line', (data) =>
      dispatch({ type: 'LOG_LINE', payload: data })
    )

    socket.on('file:stats', (data) =>
      dispatch({ type: 'FILE_STATS', payload: data })
    )

    socket.on('stream:status', (data) =>
      dispatch({ type: 'STREAM_STATUS', payload: data })
    )

    socket.on('ml:status', (data) =>
      dispatch({ type: 'ML_STATUS', payload: data })
    )

    return () => socket.disconnect()
  }, [])

  // ── Actions ───────────────────────────────────────────────
  const pauseStream  = useCallback(() => socketRef.current?.emit('stream:pause'),  [])
  const resumeStream = useCallback(() => socketRef.current?.emit('stream:resume'), [])
  const stopStream   = useCallback(() => socketRef.current?.emit('stream:stop'),   [])
  const pingMl       = useCallback(() => socketRef.current?.emit('ml:ping'),       [])

  const uploadFile = useCallback(async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        const json = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(json)
        else reject(new Error(json.error || `Upload failed (${xhr.status})`))
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })
  }, [])

  return {
    ...state,
    pauseStream,
    resumeStream,
    stopStream,
    uploadFile,
    pingMl,
  }
}

// ── Helpers ────────────────────────────────────────────────
function formatTime(iso) {
  try {
    const d = new Date(iso)
    if (isNaN(d)) return new Date().toLocaleTimeString('en-GB', { hour12: false })
    return d.toLocaleTimeString('en-GB', { hour12: false })
  } catch {
    return '--:--:--'
  }
}
