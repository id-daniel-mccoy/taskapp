import { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PdfViewerDoc } from '../hooks/useWorkspace'
import { IconButton } from './IconButton'
import { IconChevronLeft, IconChevronRight, IconMinus, IconPlus } from '../lib/icons'

GlobalWorkerOptions.workerSrc = workerUrl

interface Props {
  doc: PdfViewerDoc
}

export function PdfViewer({ doc }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([])
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(1.15)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPage(1)
    setPageCount(0)
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
      void task.destroy()
      pdfRef.current = null
    }
  }, [doc.id, doc.pdfData])

  useEffect(() => {
    const pdf = pdfRef.current
    if (!pdf || revision === 0 || pageCount === 0) return
    let cancelled = false
    const tasks: RenderTask[] = []

    const paint = async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (let number = 1; number <= pdf.numPages; number += 1) {
        if (cancelled) return
        const canvas = canvasesRef.current[number - 1]
        if (!canvas) continue
        const pdfPage = await pdf.getPage(number)
        if (cancelled) return
        const viewport = pdfPage.getViewport({ scale })
        const context = canvas.getContext('2d')
        if (!context) continue
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
        const task = pdfPage.render({ canvasContext: context, viewport })
        tasks.push(task)
        try {
          await task.promise
        } catch {
          // A cancelled render throws; ignore it and move on.
        }
      }
    }

    void paint()
    return () => {
      cancelled = true
      for (const task of tasks) {
        try {
          task.cancel()
        } catch {
          // Already finished or cancelled.
        }
      }
    }
  }, [pageCount, revision, scale])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || pageCount === 0) return
    const ratios = new Map<number, number>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const number = Number((entry.target as HTMLElement).dataset.pdfPage)
        if (number) ratios.set(number, entry.intersectionRatio)
      }
      let bestPage = 1
      let bestRatio = 0
      for (const [number, ratio] of ratios) {
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestPage = number
        }
      }
      if (bestRatio > 0) setPage(bestPage)
    }, { root, threshold: [0, 0.15, 0.35, 0.55, 0.75, 1] })

    for (const canvas of canvasesRef.current) {
      if (canvas) observer.observe(canvas)
    }
    return () => observer.disconnect()
  }, [pageCount, revision])

  const goToPage = (next: number) => {
    const number = Math.min(pageCount, Math.max(1, next))
    setPage(number)
    canvasesRef.current[number - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pdf-host">
      <div className="pdf-toolbar">
        <div className="pdf-pager">
          <IconButton label="Previous page" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            <IconChevronLeft />
          </IconButton>
          <span className="pdf-page-num">{page} / {pageCount || 1}</span>
          <IconButton label="Next page" disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>
            <IconChevronRight />
          </IconButton>
        </div>
        <div className="pdf-zoom">
          <IconButton label="Zoom out" onClick={() => setScale((value) => Math.max(0.5, Number((value - 0.15).toFixed(2))))}>
            <IconMinus />
          </IconButton>
          <span className="pdf-page-num">{Math.round(scale * 100)}%</span>
          <IconButton label="Zoom in" onClick={() => setScale((value) => Math.min(3, Number((value + 0.15).toFixed(2))))}>
            <IconPlus />
          </IconButton>
        </div>
      </div>
      <div className="pdf-scroll" ref={scrollRef}>
        {error && <p className="empty-note">{error}</p>}
        {!error && pageCount === 0 && <p className="empty-note">Opening PDF…</p>}
        {!error && Array.from({ length: pageCount }, (_, index) => (
          <canvas
            key={`${doc.id}-${index}`}
            data-pdf-page={index + 1}
            ref={(node) => {
              canvasesRef.current[index] = node
            }}
          />
        ))}
      </div>
    </div>
  )
}
