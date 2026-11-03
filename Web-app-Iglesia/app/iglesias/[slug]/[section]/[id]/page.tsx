import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { PageIntro, PublicShell } from '@/components/site/public-shell'
import { SafeImage } from '@/components/ui/safe-image'
import { getChurchBySlug, getHeritageObjects, getSaints } from '@/lib/data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string; id: string }>
}): Promise<Metadata> {
  const { slug, section, id } = await params
  const church = await getChurchBySlug(slug)
  if (!church || !['patrimonio', 'santos'].includes(section)) {
    return { title: 'Registro no encontrado' }
  }
  const records = section === 'santos' ? await getSaints(church.id) : await getHeritageObjects(church.id)
  const record = records.find((item) => item.id === id)
  if (!record) return { title: 'Registro no encontrado' }

  return {
    title: `${record.name} · ${church.name} · Archivo Iglesias de Mérida`,
    description: record.description ?? `Ficha de acervo de ${record.name} en ${church.name}, Mérida, Yucatán.`,
  }
}

export default async function ChurchRecordPage({
  params,
}: {
  params: Promise<{ slug: string; section: string; id: string }>
}) {
  const { slug, section, id } = await params
  const church = await getChurchBySlug(slug)
  if (!church || !['patrimonio', 'santos'].includes(section)) notFound()

  const records = section === 'santos' ? await getSaints(church.id) : await getHeritageObjects(church.id)
  const record = records.find((item) => item.id === id)
  if (!record || record.status !== 'publicado' || record.visibility !== 'publico') notFound()

  const isSaint = section === 'santos'
  const saintRecord = isSaint ? (record as import('@/lib/data/models').Saint) : null
  const objectRecord = !isSaint ? (record as import('@/lib/data/models').HeritageObject) : null

  return (
    <PublicShell>
      <PageIntro
        title={record.name}
        description={`${isSaint ? 'Santo / Imagen devocional' : 'Objeto patrimonial'} · ${church.name}`}
      />

      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Navegación de regreso */}
          <Link
            href={`/iglesias/${church.slug}/${section}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver a {isSaint ? 'santos e imágenes' : 'patrimonio'} de {church.name}
          </Link>

          {/* Ficha visual y datos */}
          <div className="grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
              <SafeImage
                src={record.coverPath}
                alt={record.name}
                fallbackText={record.name}
                fallbackCategory={isSaint ? 'santo' : 'patrimonio'}
                aspectRatioClass="aspect-[4/3] md:aspect-[4/5]"
                className="transition-transform duration-500 hover:scale-102"
              />
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-gold-text">
                    <Tag className="size-3" aria-hidden />
                    {isSaint ? (saintRecord?.kind || 'Imagen devocional') : (objectRecord?.category || 'Bien patrimonial')}
                  </span>
                  {isSaint && saintRecord?.feastDayMonth && saintRecord.feastDayDay && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Calendar className="size-3" aria-hidden />
                      Festividad: {saintRecord.feastDayDay}/{saintRecord.feastDayMonth}
                    </span>
                  )}
                  {!isSaint && objectRecord && objectRecord.quantity > 1 && (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      Cantidad: {objectRecord.quantity} piezas
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-3xl font-semibold leading-tight">{record.name}</h2>
                {isSaint && saintRecord?.invocation && (
                  <p className="text-sm italic text-muted-foreground">
                    Advocación: {saintRecord.invocation}
                  </p>
                )}

                <div className="border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Sede parroquial
                  </h3>
                  <p className="text-sm font-medium">{church.name}</p>
                  <p className="text-xs text-muted-foreground">{church.address ?? 'Mérida, Yucatán'}</p>
                </div>
              </div>

              {record.description && (
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Descripción del acervo
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {record.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Historia y reseña detallada (lectura a 68ch) */}
          {record.history && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
              <h3 className="font-serif text-2xl font-semibold mb-4">Historia y antecedentes</h3>
              <div className="prose prose-stone dark:prose-invert max-w-[68ch] leading-relaxed text-muted-foreground text-base">
                <p>{record.history}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  )
}
