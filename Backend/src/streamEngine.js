import { v4 as uuidv4 } from 'uuid'
import mlClient from './mlClient.js'
import detector from './detector.js'

const MIN_INTERVAL = parseInt(process.env.STREAM_INTERVAL_MIN, 10) || 800
const MAX_INTERVAL = parseInt(process.env.STREAM_INTERVAL_MAX, 10) || 1500

class StreamEngine {
  constructor() {
    this.io            = null
    this.queue         = []
    this.currentIndex  = 0
    this.totalRows     = 0
    this.isStreaming   = false
    this.isPaused      = false
    this._timer        = null

    // Running totals for stats events
    this._stats = { total: 0, attacks: 0, normal: 0 }

    // IP rate tracker: Map<ip, { count, firstSeen }>
    this._ipTracker = new Map()
  }

  // Called once by server.js after io is ready
  init(io) {
    this.io = io
  }

  // ── Public API ───────────────────────────────────────────────

  load(rows) {
    this.stop()
    this.queue        = rows
    this.totalRows    = rows.length
    this.currentIndex = 0
    this._stats       = { total: 0, attacks: 0, normal: 0 }
    this._ipTracker.clear()
    console.log(`[stream] loaded ${rows.length} rows`)
  }

  start() {
    if (this.queue.length === 0) {
      console.warn('[stream] start() called with empty queue, ignoring')
      return
    }
    this.isStreaming = true
    this.isPaused    = false
    this._emit('stream:status', {
      progress: 0,
      isStreaming: true,
      isPaused: false,
      totalRows: this.totalRows,
    })
    this._emit('log:line', {
      ts: new Date().toISOString(),
      level: 'INFO',
      message: `Stream started — ${this.totalRows} rows queued`,
    })
    this._scheduleNext()
  }

  pause() {
    if (!this.isStreaming || this.isPaused) return
    this.isPaused = true
    clearTimeout(this._timer)
    this._emit('stream:status', { progress: this.progress, isStreaming: true, isPaused: true })
    this._emit('log:line', { ts: new Date().toISOString(), level: 'INFO', message: 'Stream paused' })
  }

  resume() {
    if (!this.isStreaming || !this.isPaused) return
    this.isPaused = false
    this._emit('stream:status', { progress: this.progress, isStreaming: true, isPaused: false })
    this._emit('log:line', { ts: new Date().toISOString(), level: 'INFO', message: 'Stream resumed' })
    this._scheduleNext()
  }

  stop() {
    this.isStreaming = false
    this.isPaused    = false
    clearTimeout(this._timer)
  }

  get progress() {
    if (this.totalRows === 0) return 0
    return Math.min(100, Math.round((this.currentIndex / this.totalRows) * 100))
  }

  // ── Internal ─────────────────────────────────────────────────

  _scheduleNext() {
    if (!this.isStreaming || this.isPaused) return
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL)
    this._timer = setTimeout(() => this._processNext(), delay)
  }

  async _processNext() {
    if (!this.isStreaming || this.isPaused) return

    // All rows consumed
    if (this.currentIndex >= this.queue.length) {
      this.stop()
      this._emit('stream:status', {
        progress: 100,
        isStreaming: false,
        isPaused: false,
        totalRows: this.totalRows,
      })
      this._emit('log:line', {
        ts: new Date().toISOString(),
        level: 'INFO',
        message: `Stream complete — ${this._stats.attacks} attack rows detected out of ${this._stats.total}`,
      })
      return
    }

    const row = this.queue[this.currentIndex++]

    // Classify the row (ML first, rule-based fallback)
    let result
    try {
      result = await mlClient.predictRow(row)
    } catch {
      result = detector.analyze(row)
    }

    this._handleResult(row, result)
    this._scheduleNext()
  }

  _handleResult(row, result) {
    const isAttack    = result.is_attack
    const attackProb  = result.attack_probability ?? 0
    const attackType  = result.attack_type ?? (isAttack ? 'DDoS' : 'BENIGN')

    this._stats.total++
    if (isAttack) this._stats.attacks++
    else          this._stats.normal++

    // Track per-IP request counts
    const ipEntry = this._ipTracker.get(row.src_ip) ?? { count: 0, firstSeen: Date.now() }
    ipEntry.count++
    this._ipTracker.set(row.src_ip, ipEntry)

    const now = new Date().toISOString()

    // 1. traffic:update  ────────────────────────────────────────
    this._emit('traffic:update', {
      timestamp:     now,
      totalTraffic:  row.bytes_per_sec,
      attackTraffic: isAttack ? row.bytes_per_sec : 0,
      normalTraffic: isAttack ? 0 : row.bytes_per_sec,
      packetRate:    row.packet_rate,
    })

    // 2. threat:detected (attacks only) ───────────────────────────
    if (isAttack) {
      this._emit('threat:detected', {
        id:          `T-${uuidv4().slice(0, 8).toUpperCase()}`,
        src_ip:      row.src_ip,
        dst_ip:      row.dst_ip,
        attack_type: attackType,
        severity:    getSeverity(attackProb),
        probability: attackProb,
        bytes:       row.bytes_per_sec,
        protocol:    row.protocol,
        timestamp:   now,
        status:      attackProb > 0.85 ? 'BLOCKED' : 'MITIGATING',
      })

      // Log line for attacks
      this._emit('log:line', {
        ts:      now,
        level:   attackProb > 0.85 ? 'ERROR' : 'WARN',
        message: `[${attackType}] ${row.src_ip} → ${row.dst_ip}  prob=${(attackProb * 100).toFixed(1)}%  ${formatBytes(row.bytes_per_sec)}/s`,
      })
    } else {
      // Occasional info log for normal traffic
      if (this._stats.total % 10 === 0) {
        this._emit('log:line', {
          ts:      now,
          level:   'INFO',
          message: `[BENIGN] ${row.src_ip} — ${formatBytes(row.bytes_per_sec)}/s  pps=${row.packet_rate}`,
        })
      }
    }

    // 3. file:stats  ───────────────────────────────────────────
    const safePercent = this._stats.total > 0
      ? Math.round((this._stats.normal / this._stats.total) * 100)
      : 100

    this._emit('file:stats', {
      total_rows:      this.totalRows,
      processed_rows:  this._stats.total,
      attack_rows:     this._stats.attacks,
      normal_rows:     this._stats.normal,
      safe_percentage: safePercent,
    })

    // 4. stream:status  ────────────────────────────────────────
    this._emit('stream:status', {
      progress:    this.progress,
      isStreaming: this.isStreaming,
      isPaused:    this.isPaused,
      totalRows:   this.totalRows,
    })
  }

  _emit(event, payload) {
    if (this.io) this.io.emit(event, payload)
  }
}

// ── Helpers ────────────────────────────────────────────────────
function getSeverity(probability) {
  if (probability >= 0.85) return 'high'
  if (probability >= 0.55) return 'medium'
  return 'low'
}

function formatBytes(bps) {
  if (!bps || bps === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(3, Math.floor(Math.log(bps) / Math.log(1024)))
  return `${(bps / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export default new StreamEngine()
