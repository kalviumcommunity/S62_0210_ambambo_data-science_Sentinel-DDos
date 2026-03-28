import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { uploadRouter } from './src/upload.js'
import streamEngine from './src/streamEngine.js'
import { registerSocketHandlers } from './src/socketHandlers.js'

const app = express()
const httpServer = createServer(app)

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Socket.IO ────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  // Increase buffer to handle bursty data without dropping events
  maxHttpBufferSize: 1e7,
})

// ── Express middleware ───────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json({ limit: '10mb' }))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/upload', uploadRouter)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    streaming: streamEngine.isStreaming,
    isPaused: streamEngine.isPaused,
    progress: streamEngine.progress,
  })
})

// ── Init stream engine with socket.io ───────────────────────
streamEngine.init(io)

// ── Socket.IO connection handling ───────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`)

  // Send current stream state to newly connected client
  socket.emit('stream:status', {
    progress: streamEngine.progress,
    isStreaming: streamEngine.isStreaming,
    isPaused: streamEngine.isPaused,
    totalRows: streamEngine.totalRows,
  })

  registerSocketHandlers(socket, io, streamEngine)

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`)
  })
})

// ── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 4000
httpServer.listen(PORT, () => {
  console.log(`\n🛡  Sentinel DDoS Backend`)
  console.log(`   → HTTP/WS  : http://localhost:${PORT}`)
  console.log(`   → Frontend : ${FRONTEND_URL}`)
  console.log(`   → Python   : ${process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'}\n`)
})
