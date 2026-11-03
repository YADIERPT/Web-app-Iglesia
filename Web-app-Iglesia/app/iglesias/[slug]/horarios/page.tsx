import { CalendarDays, Clock } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { getChurchBySlug, getMassSchedules, getPublicEvents, getScheduleExceptions } from '@/lib/data'
import { formatDate, formatTime } from '@/lib/format'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default async function ChurchSchedulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const church = await getChurchBySlug(slug)
  if (!church) notFound()

  const [schedules, events, exceptions] = await Promise.all([getMassSchedules(church.id), getPublicEvents(church.id), getScheduleExceptions(church.id)])
  return (
    <PublicShell>
      <PageIntro title={`Horarios · ${church.name}`} description="Misas semanales y próximas actividades públicas de esta iglesia." />
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-7">
            <Clock className="size-6 text-primary" aria-hidden />
            <h2 className="mt-5 font-serif text-3xl font-semibold">Misas semanales</h2>
            {schedules.length === 0 ? (
              <div className="mt-8"><EmptyState>Aún no hay horarios publicados.</EmptyState></div>
            ) : (
              <div className="mt-8 divide-y divide-border">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{schedule.label}</p>
                      {schedule.presider && <p className="mt-1 text-xs text-muted-foreground">Celebrante: {schedule.presider}</p>}
                    </div>
                    <span className="text-right text-sm text-gold-text">{DAYS[schedule.weekday]} · {formatTime(schedule.time)}{schedule.language === 'maya' ? ' · Maya' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
          {exceptions.length > 0 && <article className="rounded-xl border border-border bg-card p-7 md:col-span-2"><h2 className="font-serif text-3xl font-semibold">Cambios próximos</h2><div className="mt-6 divide-y divide-border">{exceptions.map((exception) => <div key={exception.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><span>{formatDate(exception.onDate, { day: 'numeric', month: 'long' })}</span><span className="text-right text-gold-text">{exception.action === 'cancelar' ? 'Misa cancelada' : `Horario cambiado a ${exception.newTime ? formatTime(exception.newTime) : 'una hora distinta'}`}{exception.note ? ` · ${exception.note}` : ''}</span></div>)}</div></article>}
          <article className="rounded-xl border border-border bg-card p-7">
            <CalendarDays className="size-6 text-primary" aria-hidden />
            <h2 className="mt-5 font-serif text-3xl font-semibold">Próximas fechas</h2>
            {events.length === 0 ? (
              <div className="mt-8"><EmptyState>Aún no hay eventos publicados.</EmptyState></div>
            ) : (
              <div className="mt-8 divide-y divide-border">
                {events.map((event) => (
                  <div key={event.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium">{event.title}</p>
                      <span className="text-right text-sm text-gold-text">{formatDate(event.date, { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    {event.time && <p className="mt-2 text-xs text-muted-foreground">{formatTime(event.time)}</p>}
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </PublicShell>
  )
}
