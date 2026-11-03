import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { SafeImage } from '@/components/ui/safe-image'
import { getChurchBySlug, getHeritageObjects, getSaints, listDocuments } from '@/lib/data'

const SECTION_COPY: Record<string, { title: string; description: string }> = {
  historia: { title: 'Historia', description: 'Hitos, relatos y documentos que explican la historia de esta iglesia.' },
  patrimonio: { title: 'Patrimonio', description: 'Objetos históricos y de valor documentados por la iglesia.' },
  santos: { title: 'Santos e imágenes', description: 'Santos, advocaciones e imágenes religiosas de la iglesia.' },
  archivo: { title: 'Archivo', description: 'Documentos públicos disponibles para consulta y descarga.' },
  horarios: { title: 'Horarios', description: 'Misas semanales y próximas actividades públicas.' },
  servicios: { title: 'Servicios', description: 'Servicios y cuotas sugeridas publicados por la iglesia.' },
}

export default async function ChurchSectionPage({ params }: { params: Promise<{ slug: string; section: string }> }) {
  const { slug, section } = await params
  const church = await getChurchBySlug(slug)
  const copy = SECTION_COPY[section]
  if (!church || !copy) notFound()
  const objects = section === 'patrimonio' ? await getHeritageObjects(church.id) : []
  const saints = section === 'santos' ? await getSaints(church.id) : []
  const documents = section === 'archivo' ? await listDocuments(church.id) : []
  return (
    <PublicShell>
      <PageIntro title={`${copy.title} · ${church.name}`} description={copy.description} />
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          {section === 'historia' && (
            <article className="rounded-xl border border-border bg-card p-7">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold-text">Historia</p>
              {church.foundedYear && <p className="mt-4 text-sm text-muted-foreground">Fundada en {church.foundedYear}</p>}
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                {church.historyFull ?? church.historySummary ?? 'Aún no hay una historia publicada para esta iglesia.'}
              </p>
            </article>
          )}
          {section === 'patrimonio' && (
            objects.length === 0 ? (
              <EmptyState>Aún no hay registros públicos de patrimonio.</EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {objects
                  .filter((object) => object.status === 'publicado' && object.visibility === 'publico')
                  .map((object) => (
                    <Link
                      key={object.id}
                      href={`/iglesias/${church.slug}/patrimonio/${object.id}`}
                      className="group overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs"
                    >
                      <SafeImage
                        src={object.coverPath}
                        alt={object.name}
                        fallbackText={object.name}
                        fallbackCategory="patrimonio"
                        aspectRatioClass="aspect-[4/3]"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="p-5">
                        <h2 className="font-serif text-xl font-medium leading-tight group-hover:text-primary transition-colors">{object.name}</h2>
                        {object.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{object.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )
          )}
          {section === 'santos' && (
            saints.length === 0 ? (
              <EmptyState>Aún no hay santos o imágenes publicados.</EmptyState>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {saints
                  .filter((saint) => saint.status === 'publicado' && saint.visibility === 'publico')
                  .map((saint) => (
                    <Link
                      key={saint.id}
                      href={`/iglesias/${church.slug}/santos/${saint.id}`}
                      className="group overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs"
                    >
                      <SafeImage
                        src={saint.coverPath}
                        alt={saint.name}
                        fallbackText={saint.name}
                        fallbackCategory="santo"
                        aspectRatioClass="aspect-[4/3]"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="p-5">
                        <h2 className="font-serif text-xl font-medium leading-tight group-hover:text-primary transition-colors">{saint.name}</h2>
                        {saint.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{saint.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )
          )}
          {section === 'archivo' && (documents.length === 0 ? <EmptyState>Aún no hay documentos públicos.</EmptyState> : <div className="grid gap-4 md:grid-cols-2">{documents.filter((document) => document.status === 'publicado' && document.visibility === 'publico').map((document) => <article key={document.id} className="rounded-xl border border-border bg-card p-6"><FileText className="size-6 text-primary" aria-hidden /><h2 className="mt-5 font-serif text-2xl font-semibold">{document.title}</h2>{document.docType && <p className="mt-2 text-xs uppercase tracking-[0.12em] text-gold-text">{document.docType}</p>}<p className="mt-3 text-sm text-muted-foreground">{document.description}</p><div className="mt-5 flex flex-wrap gap-4"><a href={document.filePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-gold-text hover:underline">Abrir <ExternalLink className="size-3.5" aria-hidden /></a><a href={document.filePath} download className="inline-flex items-center gap-2 text-sm font-semibold text-gold-text hover:underline">Descargar <Download className="size-3.5" aria-hidden /></a></div></article>)}</div>)}
          {!['historia', 'patrimonio', 'santos', 'archivo'].includes(section) && <EmptyState>Este contenido se cargará desde el panel cuando existan registros publicados.</EmptyState>}
        </div>
      </section>
    </PublicShell>
  )
}
