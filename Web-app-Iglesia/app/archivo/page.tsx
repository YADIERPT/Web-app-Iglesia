import type { Metadata } from 'next'
import { Download, FileText, ExternalLink } from 'lucide-react'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { PdfViewer } from '@/components/site/pdf-viewer'
import { getChurches, listDocuments } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Archivo histórico · Iglesias de Mérida',
  description: 'Documentos históricos, crónicas, actas y testimonios digitalizados de las iglesias de Mérida, Yucatán.',
}

export default async function ArchivoPage({ searchParams }: { searchParams: Promise<{ iglesia?: string; tipo?: string }> }) {
  const { iglesia, tipo } = await searchParams
  const [churches, documents] = await Promise.all([getChurches(), listDocuments()])
  const filteredDocuments = documents.filter((document) => {
    const matchesChurch = !iglesia || document.churchId === iglesia
    const matchesType = !tipo || document.docType === tipo
    return matchesChurch && matchesType
  })
  const documentTypes = Array.from(new Set(documents.map((document) => document.docType).filter((type): type is string => Boolean(type)))).sort()
  return (
    <PublicShell>
      <PageIntro title="Archivo histórico" description="Documentos públicos, crónicas y testimonios que ayudan a leer la memoria de nuestras iglesias." />
      <section className="px-6 py-12 md:px-10 lg:px-16"><div className="mx-auto max-w-5xl">
        <form className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-medium">Iglesia
            <select name="iglesia" defaultValue={iglesia ?? ''} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Todas las iglesias</option>
              {churches.map((church) => <option key={church.id} value={church.id}>{church.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Tipo de documento
            <select name="tipo" defaultValue={tipo ?? ''} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Todos los tipos</option>
              {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <button className="self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Filtrar</button>
        </form>
        {documents.length === 0 ? <EmptyState>Aún no hay documentos publicados.</EmptyState> : filteredDocuments.length === 0 ? <EmptyState>No hay documentos que coincidan con estos filtros.</EmptyState> : <div className="grid gap-4 md:grid-cols-2">{filteredDocuments.map((document) => {
          const church = churches.find((item) => item.id === document.churchId)
          return <article key={document.id} className="rounded-xl border border-border bg-card p-6"><FileText className="size-6 text-primary" aria-hidden /><h2 className="mt-5 font-serif text-2xl font-semibold">{document.title}</h2><p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Iglesia:</span> {church?.name ?? 'Iglesia no disponible'}</p>{document.docType && <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gold-text">{document.docType}</p>}<PdfViewer source={document.filePath} title={document.title} /><div className="mt-5 flex flex-wrap gap-4"><a href={document.filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-text hover:underline">Abrir en otra pestaña <ExternalLink className="size-3.5" aria-hidden /></a><a href={document.filePath} download className="inline-flex items-center gap-2 text-sm font-semibold text-gold-text hover:underline">Descargar <Download className="size-3.5" aria-hidden /></a></div></article>
        })}</div>}
      </div></section>
    </PublicShell>
  )
}
