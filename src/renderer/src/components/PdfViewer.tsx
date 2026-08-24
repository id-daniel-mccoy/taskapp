import { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { WorkspaceDocument } from '../hooks/useWorkspace'

GlobalWorkerOptions.workerSrc = workerUrl

interface Props {
  doc: WorkspaceDocument
}

export function PdfViewer({ doc }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [scale, setScale] = useState(1.15)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPage(1)
    setError(null)
    const data = doc.pdfData
    if (!data) {
      setError('This PDF could not be loaded.')
      return
    }

    const task = getDocument({ data: data.slice() })
    void task.promise.then((pdf) => {
      if (cancelled) {
        void pdf.destroy()
        return
      }
      pdfRef.current = pdf
      setPageCount(pdf.numPages)
      setRevision((value) => value + 1)
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not read this PDF.')
    })

    return () => {
      cancelled = true
      void pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [doc.id, doc.pdfData])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas || revision === 0) return
    let cancelled = false

    void pdf.getPage(page).then(async (pdfPage) => {
      const viewport = pdfPage.getViewport({ scale })
      const context = canvas.getContext('2d')
      if (!context || cancelled) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      await pdfPage.render({ canvasContext: context, viewport }).promise
    })

    return () => {
      cancelled = true
    }
  }, [page, revision, scale])

  return (
    <div className="pdf-host">
      <div className="pdf-toolbar">
        <div className="json-actions">
          <button className="chip-btn" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
            Previous
          </button>
          <span>{page} / {pageCount}</span>
          <button className="chip-btn" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount}>
            Next
          </button>
        </div>
        <div className="json-actions">
          <button className="chip-btn" onClick={() => setScale((value) => Math.max(0.5, Number((value - 0.15).toFixed(2))))}>−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="chip-btn" onClick={() => setScale((value) => Math.min(3, Number((value + 0.15).toFixed(2))))}>+</button>
        </div>
      </div>
      <div className="pdf-scroll">
        {error ? <p className="empty-note">{error}</p> : <canvas ref={canvasRef} />}
      </div>
    </div>
  )
}
