'use client'

import { ChevronLeft, ChevronRight, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type PdfViewerProps = {
  source: string
  title: string
}

export function PdfViewer({ source, title }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(1.15)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined

    async function renderPage() {
      setLoading(true)
      setError(null)
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        const document = await pdfjs.getDocument({ url: source }).promise
        if (cancelled) return
        setPageCount(document.numPages)
        const pdfPage = await document.getPage(page)
        const viewport = pdfPage.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas || cancelled) return
        const context = canvas.getContext('2d')
        if (!context) throw new Error('No se pudo preparar el lienzo del visor.')
        canvas.width = viewport.width
        canvas.height = viewport.height
        renderTask = pdfPage.render({ canvas, canvasContext: context, viewport })
        await renderTask.promise
      } catch (renderError) {
        if (!cancelled && (renderError as { name?: string }).name !== 'RenderingCancelledException') {
          setError('No se pudo cargar el documento. Puedes descargar el PDF para abrirlo fuera del visor.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void renderPage()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [page, scale, source])

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-secondary/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">{title} · página {pageCount ? `${page} de ${pageCount}` : '…'}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setScale((value) => Math.max(0.8, value - 0.15))} className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Alejar"><ZoomOut className="size-4" aria-hidden /></button>
          <button type="button" onClick={() => setScale((value) => Math.min(2, value + 0.15))} className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Acercar"><ZoomIn className="size-4" aria-hidden /></button>
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="size-4" aria-hidden /></button>
          <button type="button" disabled={!pageCount || page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40" aria-label="Página siguiente"><ChevronRight className="size-4" aria-hidden /></button>
        </div>
      </div>
      <div className="flex min-h-64 items-center justify-center overflow-auto p-4">
        {loading && <LoaderCircle className="size-6 animate-spin text-primary" aria-label="Cargando documento" />}
        {error && <p className="max-w-sm text-center text-sm text-destructive">{error}</p>}
        <canvas ref={canvasRef} className={loading || error ? 'hidden' : 'h-auto max-w-full shadow-sm'} aria-label={`Página ${page} de ${title}`} />
      </div>
    </div>
  )
}
