import { useEffect, useMemo, useState } from 'react'
import type { ImageViewerDoc } from '../hooks/useWorkspace'
import { IconButton } from './IconButton'
import { IconMinus, IconPlus } from '../lib/icons'

interface Props {
  doc: ImageViewerDoc
}

export function ImageViewer({ doc }: Props) {
  const [scale, setScale] = useState(1)
  const [fit, setFit] = useState(true)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [error, setError] = useState<string | null>(null)

  const src = useMemo(() => {
    const blob = new Blob([doc.data], { type: doc.mime || 'application/octet-stream' })
    return URL.createObjectURL(blob)
  }, [doc.data, doc.mime])

  useEffect(() => {
    return () => URL.revokeObjectURL(src)
  }, [src])

  useEffect(() => {
    setScale(1)
    setFit(true)
    setSize({ width: 0, height: 0 })
    setError(null)
  }, [doc.id])

  return (
    <div className="image-host">
      <div className="image-toolbar">
        <div className="pdf-pager">
          <span className="pdf-page-num">
            {size.width && size.height ? `${size.width} × ${size.height}` : doc.label}
          </span>
        </div>
        <div className="pdf-zoom">
          <IconButton
            label="Zoom out"
            onClick={() => {
              setFit(false)
              setScale((value) => Math.max(0.25, Number(((fit ? 1 : value) - 0.15).toFixed(2))))
            }}
          >
            <IconMinus />
          </IconButton>
          <button
            type="button"
            className={`pdf-page-num${fit ? ' on' : ''}`}
            title="Fit to window"
            aria-label={fit ? 'Fit to window' : `Zoom ${Math.round(scale * 100)} percent. Click to fit.`}
            onClick={() => {
              setFit(true)
              setScale(1)
            }}
          >
            {fit ? 'Fit' : `${Math.round(scale * 100)}%`}
          </button>
          <IconButton
            label="Zoom in"
            onClick={() => {
              setFit(false)
              setScale((value) => Math.min(4, Number(((fit ? 1 : value) + 0.15).toFixed(2))))
            }}
          >
            <IconPlus />
          </IconButton>
        </div>
      </div>
      <div className="image-scroll">
        {error ? (
          <p className="empty-note">{error}</p>
        ) : (
          <div
            className={`image-frame${fit ? ' is-fit' : ''}`}
            style={fit ? undefined : { transform: `scale(${scale})`, transformOrigin: 'center top' }}
          >
            <img
              src={src}
              alt={doc.name}
              draggable={false}
              onLoad={(event) => {
                setSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight
                })
              }}
              onError={() => setError(`Could not display this ${doc.label} image.`)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
