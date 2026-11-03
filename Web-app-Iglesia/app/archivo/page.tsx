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
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <form className="mb-8 grid gap-3 rounded-xl border border-border/80 bg-card p-4 sm:grid-cols-[1fr_1fr_auto] shadow-xs">
            <label className="grid gap-1.5 text-xs font-medium text-foreground">
              Iglesia
              <select name="iglesia" defaultValue={iglesia ?? ''} className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm font-normal outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Todas las iglesias</option>
                {churches.map((church) => <option key={church.id} value={church.id}>{church.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-foreground">
              Tipo de documento
              <select name="tipo" defaultValue={tipo ?? ''} className="h-10 rounded-lg border border-border/80 bg-background px-3 text-sm font-normal outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Todos los tipos</option>
                {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <button className="self-end h-10 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90">
              Filtrar
            </button>
          </form>

          {documents.length === 0 ? (
            <EmptyState>Aún no hay documentos publicados.</EmptyState>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState>No hay documentos que coincidan con estos filtros.</EmptyState>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredDocuments.map((document) => {
                const church = churches.find((item) => item.id === document.churchId)
                return (
                  <article key={document.id} className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 text-primary">
                      <FileText className="size-5" aria-hidden />
                    </div>
                    <h2 className="mt-4 font-serif text-xl font-medium leading-tight text-foreground">{document.title}</h2>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Sede:</span> {church?.name ?? 'Iglesia no disponible'}
                    </p>
                    {document.docType && (
                      <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-text">{document.docType}</p>
                    )}
                    <PdfViewer source={document.filePath} title={document.title} />
                    <div className="mt-5 flex flex-wrap gap-4 border-t border-border/60 pt-4">
                      <a href={document.filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
                        Abrir visor <ExternalLink className="size-3" aria-hidden />
                      </a>
                      <a href={document.filePath} download className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
                        Descargar <Download className="size-3" aria-hidden />
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  )
}
