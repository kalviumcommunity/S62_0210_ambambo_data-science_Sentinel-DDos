import express from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'

// Store file in memory — no disk I/O needed
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/json', 'text/plain', 'application/octet-stream']
    const extOk = /\.(csv|json)$/i.test(file.originalname)
    if (extOk || allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only CSV or JSON files are accepted'))
  },
})

export const uploadRouter = express.Router()

// POST /api/upload
uploadRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' })
  }

  try {
    const rows = parseFile(req.file)
    if (rows.length === 0) {
      return res.status(400).json({ error: 'File parsed but contained no data rows' })
    }

    // Pass rows to the stream engine (imported lazily to avoid circular dep)
    import('./streamEngine.js').then(({ default: streamEngine }) => {
      streamEngine.load(rows)
      streamEngine.start()
    })

    return res.json({
      success: true,
      total_rows: rows.length,
      message: `Parsed ${rows.length} rows — streaming started`,
    })
  } catch (err) {
    console.error('[upload] parse error:', err.message)
    return res.status(422).json({ error: `Parse failed: ${err.message}` })
  }
})

// ── File parsing ─────────────────────────────────────────────
function parseFile(file) {
  const isJson =
    file.originalname.toLowerCase().endsWith('.json') ||
    file.mimetype === 'application/json'

  let rawRows
  if (isJson) {
    const parsed = JSON.parse(file.buffer.toString('utf-8'))
    rawRows = Array.isArray(parsed)
      ? parsed
      : parsed.data ?? parsed.rows ?? parsed.records ?? []
  } else {
    rawRows = parse(file.buffer, {
      columns: true,          // first row is header
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,              // handle UTF-8 BOM
    })
  }

  return rawRows.map(normalizeRow).filter(Boolean)
}

// ── Row normalisation ─────────────────────────────────────────
/**
 * Converts arbitrary CSV/JSON fields into a consistent internal schema.
 * The `_raw` field preserves the original row for ML feature extraction.
 */
function normalizeRow(raw) {
  if (!raw || typeof raw !== 'object') return null

  // Build a lowercase–snake_case key map for fuzzy field lookup
  const r = {}
  for (const [k, v] of Object.entries(raw)) {
    const key = k
      .trim()
      .toLowerCase()
      .replace(/[^\w]/g, '_') // non-word chars → _
      .replace(/_+/g, '_')    // collapse multiple underscores
    r[key] = v
  }

  const pick = (...keys) => {
    for (const k of keys) {
      const v = r[k]
      if (v !== undefined && v !== '') return v
    }
    return undefined
  }

  const parseNum = (v) => {
    const n = parseFloat(v)
    return isFinite(n) ? n : 0
  }

  return {
    timestamp: pick('timestamp', 'flow_id', 'date', 'time') || new Date().toISOString(),
    src_ip:    pick('source_ip', 'src_ip', 'source ip', 'src ip', 'ip_src', 'sip') || '0.0.0.0',
    dst_ip:    pick('destination_ip', 'dst_ip', 'destination ip', 'dst ip', 'ip_dst', 'dip') || '0.0.0.0',
    packet_rate:  parseNum(pick('flow_packets_s', 'packet_rate', 'packets_s', 'total_fwd_packets', 'pkt_rate')),
    bytes_per_sec: parseNum(pick('flow_bytes_s', 'bytes_per_sec', 'bytes_s', 'total_length_of_fwd_packets', 'bps')),
    protocol:  pick('protocol', 'proto') || 'TCP',
    label:     pick('label', 'class', 'attack_type') || null, // ground-truth if present
    _raw: raw,  // preserved for ML service
  }
}
