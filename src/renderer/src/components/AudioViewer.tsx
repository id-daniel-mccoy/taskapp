import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioViewerDoc } from '../hooks/useWorkspace'
import { IconPause, IconPlay } from '../lib/icons'

interface Props {
  doc: AudioViewerDoc
}

function asBlobPart(data: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(data)
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function AudioViewer({ doc }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const src = useMemo(() => {
    const blob = new Blob([asBlobPart(doc.data)], { type: doc.mime || 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }, [doc.data, doc.mime])

  useEffect(() => {
    return () => URL.revokeObjectURL(src)
  }, [src])

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    setError(null)
    const node = audioRef.current
    if (node) {
      node.pause()
      node.currentTime = 0
    }
    return () => {
      node?.pause()
    }
  }, [doc.id, src])

  const toggle = useCallback(() => {
    const node = audioRef.current
    if (!node) return
    if (node.paused) void node.play()
    else node.pause()
  }, [])

  return (
    <div className="audio-host">
      <div className="image-toolbar">
        <div className="pdf-pager">
          <span className="pdf-page-num">{doc.label}</span>
        </div>
        <span className="audio-meta">{doc.name}</span>
      </div>
      <div className="audio-stage">
        {error ? (
          <p className="empty-note">{error}</p>
        ) : (
          <div className="audio-card">
            <button
              type="button"
              className="audio-play"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={toggle}
            >
              {playing ? <IconPause width={28} height={28} /> : <IconPlay width={28} height={28} />}
            </button>
            <div className="audio-timeline">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(current, duration || 0)}
                aria-label="Seek"
                onChange={(event) => {
                  const next = Number(event.target.value)
                  const node = audioRef.current
                  if (node) node.currentTime = next
                  setCurrent(next)
                }}
              />
              <div className="audio-times">
                <span>{formatTime(current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onError={() => setError(`Could not play this ${doc.label} file.`)}
      />
    </div>
  )
}
