/**
 * Registers all Socket.IO event handlers for a single connected client.
 * Keeps server.js clean — one file per concern.
 */
import mlClient from './mlClient.js'

export function registerSocketHandlers(socket, _io, streamEngine) {

  // ── Stream control ───────────────────────────────────────────
  socket.on('stream:pause', () => {
    console.log(`[socket] stream:pause from ${socket.id}`)
    streamEngine.pause()
  })

  socket.on('stream:resume', () => {
    console.log(`[socket] stream:resume from ${socket.id}`)
    streamEngine.resume()
  })

  socket.on('stream:stop', () => {
    console.log(`[socket] stream:stop from ${socket.id}`)
    streamEngine.stop()
    socket.emit('stream:status', {
      progress: streamEngine.progress,
      isStreaming: false,
      isPaused: false,
      totalRows: streamEngine.totalRows,
    })
    socket.emit('log:line', {
      ts: new Date().toISOString(),
      level: 'INFO',
      message: 'Stream stopped by user',
    })
  })

  // ── ML health probe (from client UI health panel) ────────────
  socket.on('ml:ping', async () => {
    const ok = await mlClient.healthCheck()
    socket.emit('ml:status', { available: ok })
  })

  // ── Current state sync (on reconnect) ───────────────────────
  socket.on('state:sync', () => {
    socket.emit('stream:status', {
      progress:    streamEngine.progress,
      isStreaming: streamEngine.isStreaming,
      isPaused:    streamEngine.isPaused,
      totalRows:   streamEngine.totalRows,
    })
  })
}
