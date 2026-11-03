import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Image,
  Landmark,
  MapPin,
  ReceiptText,
} from 'lucide-react'
import { PageIntro, PublicShell } from '@/components/site/public-shell'
import { SafeImage } from '@/components/ui/safe-image'
import {
  getChurchBySlug,
  getMassSchedules,
  getPublicEvents,
  getScheduleExceptions,
} from '@/lib/data'
import { formatDate, formatTime, todayISO } from '@/lib/format'

const SECTIONS = [
  { slug: 'historia', label: 'Historia', icon: BookOpen },
  { slug: 'patrimonio', label: 'Patrimonio', icon: Landmark },
  { slug: 'santos', label: 'Santos e imágenes', icon: Image },
  { slug: 'archivo', label: 'Archivo', icon: FileText },
  { slug: 'horarios', label: 'Horarios', icon: Clock },
  { slug: 'servicios', label: 'Servicios', icon: ReceiptText },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const church = await getChurchBySlug((await params).slug)
  if (!church) return { title: 'Iglesia no encontrada' }
  return {
    title: `${church.name} · Archivo Iglesias de Mérida`,
    description: church.historySummary ?? `Conoce la historia, el patrimonio y los horarios de ${church.name} en Mérida, Yucatán.`,
  }
}

export default async function ChurchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const church = await getChurchBySlug(slug)
  if (!church) notFound()

  const [schedules, exceptions, events] = await Promise.all([
    getMassSchedules(church.id),
    getScheduleExceptions(church.id),
    getPublicEvents(church.id),
  ])

  // Calcular misas de hoy
  const today = todayISO()
  const now = new Date()
  const todayWeekday = now.getDay()

  const todaysMasses = schedules
    .filter((s) => s.weekday === todayWeekday)
    .map((s) => {
      const ex = exceptions.find((item) => item.massScheduleId === s.id && item.onDate === today)
      if (ex?.action === 'cancelar') return null
      const effectiveTime = ex?.action === 'mover' && ex.newTime ? ex.newTime : s.time
      return {
        ...s,
        effectiveTime,
        isMoved: ex?.action === 'mover',
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.effectiveTime.localeCompare(b.effectiveTime))

  const upcomingEvents = events.slice(0, 4)
  const mapsQuery = encodeURIComponent(`${church.name}, ${church.address ?? 'Mérida, Yucatán'}`)

  return (
    <PublicShell>
      <PageIntro
        title={church.name}
        description={church.patronSaint ? `Advocación: ${church.patronSaint}` : undefined}
      />

      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-16">
          {/* Ficha principal con foto, historia y mapa */}
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
              <SafeImage
                src={church.coverPath}
                alt={church.name}
                fallbackText={church.name}
                fallbackCategory="church"
                aspectRatioClass="aspect-[4/3]"
                className="transition-transform duration-500 hover:scale-102"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                {/* Detalle decorativo con acento sutil */}
                <div
                  className="mb-4 h-0.5 w-10 rounded-full"
                  style={{ backgroundColor: church.accentColor ?? 'var(--primary)' }}
                  aria-hidden
                />
                <h2 className="font-serif text-3xl font-normal tracking-tight text-foreground">Reseña histórica</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {church.historySummary || 'La reseña histórica de esta sede se encuentra en proceso de catalogación.'}
                </p>

                <div className="mt-5">
                  <Link
                    href={`/iglesias/${church.slug}/historia`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
                  >
                    Leer la historia completa
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="mt-8 border-t border-border/70 pt-6">
                <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{church.address ?? 'Centro Histórico, Mérida, Yucatán'}</span>
                </p>
                <div className="mt-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    Cómo llegar en Google Maps
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Navegación secundaria entre secciones de la iglesia */}
          <div>
            <h3 className="font-serif text-2xl font-normal tracking-tight mb-6 text-foreground">Contenido y acervo de la iglesia</h3>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon
                return (
                  <Link
                    key={sec.slug}
                    href={`/iglesias/${church.slug}/${sec.slug}`}
                    className="group flex min-h-14 items-center justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <span className="text-sm font-medium">{sec.label}</span>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Horarios de hoy y Próximos eventos (§5.7) */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Misas de hoy */}
            <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-5 text-primary" aria-hidden />
                  <h3 className="font-serif text-2xl font-semibold">Misas de hoy</h3>
                </div>
                <Link
                  href={`/iglesias/${church.slug}/horarios`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver todos los horarios
                </Link>
              </div>

              <div className="mt-6">
                {todaysMasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay misas programadas para el día de hoy o se encuentran suspendidas por festividad especial.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {todaysMasses.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3.5 first:pt-0">
                        <div>
                          <p className="font-medium text-sm">{m.label}</p>
                          {m.presider && <p className="text-xs text-muted-foreground">{m.presider}</p>}
                        </div>
                        <span className="font-serif text-base font-semibold text-primary">
                          {formatTime(m.effectiveTime)}
                          {m.isMoved && <span className="ml-1 text-xs font-sans text-amber-600">(Movida)</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Próximos eventos */}
            <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="size-5 text-primary" aria-hidden />
                  <h3 className="font-serif text-2xl font-semibold">Próximas actividades</h3>
                </div>
                <Link
                  href={`/iglesias/${church.slug}/horarios`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver calendario
                </Link>
              </div>

              <div className="mt-6">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay eventos públicos programados próximamente para esta sede.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {upcomingEvents.map((evt) => (
                      <div key={evt.id} className="py-3.5 first:pt-0">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-medium text-sm">{evt.title}</p>
                          <span className="text-xs text-primary font-semibold shrink-0">
                            {formatDate(evt.date, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
