/**
 * HTTP client for the Python Flask ML microservice.
 * Sends raw CSV row features, receives classification result.
 *
 * Falls back gracefully (throws) so the stream engine can
 * use the rule-based detector instead.
 */

const PYTHON_URL   = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'
const TIMEOUT_MS   = 4_000   // abort if Python is slow
const MAX_RETRIES  = 1       // one retry on network error

// Track ML service availability to avoid hammering a downed service
let _mlAvailable  = true      // optimistic default
let _lastCheck    = 0
const CHECK_INTERVAL = 15_000 // re-probe every 15 s after failure

class MlClient {
  async predictRow(row) {
    // If we know ML is down, skip immediately
    if (!_mlAvailable && Date.now() - _lastCheck < CHECK_INTERVAL) {
      throw new Error('ML service marked unavailable — using fallback')
    }

    // Clean the raw features: keep only original numeric-ish fields
    const features = this._buildFeatures(row)

    let lastErr
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this._post('/predict-row', { features })
        _mlAvailable = true
        return this._normalise(result)
      } catch (err) {
        lastErr = err
      }
    }

    // Mark service as down
    _mlAvailable = false
    _lastCheck   = Date.now()
    console.warn(`[ml-client] service unavailable: ${lastErr.message}`)
    throw lastErr
  }

  async healthCheck() {
    try {
      const res = await fetch(`${PYTHON_URL}/health`, {
        signal: AbortSignal.timeout(2_000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  // ── Private ──────────────────────────────────────────────────

  _buildFeatures(row) {
    // Send the original raw fields (minus internal underscore keys) so
    // the Python scaler gets the same column names it was trained on.
    const features = {}
    const raw = row._raw ?? {}
    for (const [k, v] of Object.entries(raw)) {
      const trimmed = k.trim()
      if (!trimmed.startsWith('_')) features[trimmed] = v
    }
    // Also inject our normalised numeric fields as fallback columns
    features['packet_rate']   = row.packet_rate
    features['bytes_per_sec'] = row.bytes_per_sec
    return features
  }

  async _post(path, body) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${PYTHON_URL}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  controller.signal,
      })
      if (!res.ok) throw new Error(`Python returned HTTP ${res.status}`)
      return res.json()
    } finally {
      clearTimeout(timer)
    }
  }

  _normalise(raw) {
    const label     = String(raw.label ?? 'UNKNOWN').trim()
    const isBenign  = /^(benign|normal|safe)$/i.test(label)
    const prob      = parseFloat(raw.attack_probability ?? (isBenign ? 0.05 : 0.9))

    return {
      label,
      attack_type:        isBenign ? 'BENIGN' : (raw.attack_type ?? label),
      attack_probability: isFinite(prob) ? prob : 0.5,
      is_attack:          raw.is_attack ?? !isBenign,
      source:             'ml',
    }
  }
}

export default new MlClient()
