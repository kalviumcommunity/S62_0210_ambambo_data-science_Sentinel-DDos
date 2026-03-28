import { useCallback, useRef, useState } from 'react'
import { useSentinel } from '../context/SentinelContext'

const ACCEPTED = '.csv,.json'

const phaseLabel = {
  idle:      'Drop a CSV / JSON file to begin',
  dragover:  'Release to upload',
  uploading: 'Uploading…',
  streaming: 'Streaming live…',
  done:      'Stream complete',
  error:     'Upload failed',
}

export default function FileUpload({ toast }) {
  const { uploadFile, streamStatus } = useSentinel()

  const [phase,    setPhase]    = useState('idle')    // idle|dragover|uploading|streaming|done|error
  const [fileName, setFileName] = useState(null)
  const [upPct,    setUpPct]    = useState(0)
  const [errMsg,   setErrMsg]   = useState(null)
  const inputRef  = useRef(null)

  // Sync with stream status from socket
  const isStreaming = streamStatus.isStreaming
  const progress    = streamStatus.progress
  const isPaused    = streamStatus.isPaused

  // If backend signals stream done, update local phase
  if (phase === 'streaming' && !isStreaming && progress >= 100) {
    setPhase('done')
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'json'].includes(ext)) {
      toast.error('Only .csv and .json files are supported')
      return
    }

    setFileName(file.name)
    setErrMsg(null)
    setPhase('uploading')
    setUpPct(0)

    try {
      const result = await uploadFile(file, setUpPct)
      toast.success(`Loaded ${result.total_rows?.toLocaleString()} rows — streaming started`)
      setPhase('streaming')
    } catch (err) {
      setErrMsg(err.message)
      setPhase('error')
      toast.error(`Upload error: ${err.message}`)
    }
  }, [uploadFile, toast])

  // ── Drag events ─────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setPhase('dragover') }
  const onDragLeave = ()  => { if (phase === 'dragover') setPhase(fileName ? 'streaming' : 'idle') }
  const onDrop      = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }
  const onPick      = (e) => handleFile(e.target.files[0])

  // ── Streaming control ────────────────────────────────────────
  const { pauseStream, resumeStream, stopStream } = useSentinel()

  const borderColor =
    phase === 'error'    ? 'border-red-500/40'    :
    phase === 'dragover' ? 'border-cyan-400/60'   :
    isStreaming          ? 'border-green-500/40'  :
    phase === 'done'     ? 'border-cyan-500/30'   :
                           'border-slate-700/60'

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed ${borderColor}
        bg-slate-800/40 transition-all duration-200 select-none overflow-hidden`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Progress bar (upload or stream) */}
      {(phase === 'uploading' || phase === 'streaming') && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-700">
          <div
            className={`h-full transition-all duration-300 ${isStreaming ? 'bg-green-400' : 'bg-cyan-400'}`}
            style={{ width: `${phase === 'uploading' ? upPct : progress}%` }}
          />
        </div>
      )}

      <div className="px-5 py-5">
        {/* ── Idle / Dragover state ── */}
        {(phase === 'idle' || phase === 'dragover') && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl
              border transition-colors duration-200
              ${phase === 'dragover'
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
                : 'bg-slate-700/50 border-slate-600/40 text-slate-500'}`}
            >
              <UploadIcon />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                {phaseLabel[phase]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Supports CIC-DDoS, CICIDS, or any normalized CSV
              </p>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-1.5 text-xs font-medium rounded-lg
                bg-cyan-500/10 text-cyan-400 border border-cyan-500/30
                hover:bg-cyan-500/20 hover:border-cyan-400/50
                transition-colors duration-150"
            >
              Browse file
            </button>
          </div>
        )}

        {/* ── Uploading state ── */}
        {phase === 'uploading' && (
          <div className="flex items-center gap-4 py-2">
            <SpinnerIcon />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 truncate">{fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${upPct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                  {upPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Streaming state ── */}
        {phase === 'streaming' && (
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg
              bg-green-500/10 border border-green-500/25">
              <span className={`w-2.5 h-2.5 rounded-full bg-green-400 ${isPaused ? '' : 'blink'}
                shadow-[0_0_6px_rgba(74,222,128,0.8)]`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-green-400 uppercase tracking-widest truncate"
                   style={{ fontFamily: 'var(--font-mono)' }}>
                  {isPaused ? 'Paused' : 'Live streaming'}
                </p>
                <span className="text-xs text-slate-500 tabular-nums flex-shrink-0"
                      style={{ fontFamily: 'var(--font-mono)' }}>
                  {progress}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{fileName}</p>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {isPaused ? (
                <CtrlBtn onClick={resumeStream} title="Resume" color="text-green-400">▶</CtrlBtn>
              ) : (
                <CtrlBtn onClick={pauseStream} title="Pause" color="text-yellow-400">⏸</CtrlBtn>
              )}
              <CtrlBtn onClick={stopStream} title="Stop" color="text-red-400">■</CtrlBtn>
            </div>
          </div>
        )}

        {/* ── Done state ── */}
        {phase === 'done' && (
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div className="flex-1">
              <p className="text-xs text-green-400 font-medium uppercase tracking-widest"
                 style={{ fontFamily: 'var(--font-mono)' }}>Stream complete</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fileName}</p>
            </div>
            <button
              onClick={() => { setPhase('idle'); setFileName(null) }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Upload another
            </button>
          </div>
        )}

        {/* ── Error state ── */}
        {phase === 'error' && (
          <div className="flex items-center gap-3">
            <span className="text-red-400 text-lg">✕</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400 font-medium uppercase tracking-widest"
                 style={{ fontFamily: 'var(--font-mono)' }}>Upload failed</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{errMsg}</p>
            </div>
            <button
              onClick={() => { setPhase('idle'); setFileName(null) }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onPick}
        aria-label="Upload network traffic dataset"
      />
    </div>
  )
}

// ── Mini helpers ───────────────────────────────────────────────
function CtrlBtn({ onClick, title, color, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded
        bg-slate-700 border border-slate-600 hover:border-slate-500
        transition-colors text-sm ${color}`}
    >
      {children}
    </button>
  )
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin text-cyan-400 flex-shrink-0" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
      <path d="M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}
