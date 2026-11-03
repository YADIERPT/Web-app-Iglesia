import type { Metadata } from 'next'
import { CalendarDays, Clock } from 'lucide-react'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { getChurches, getMassSchedules, getPublicEvents } from '@/lib/data'
import { formatDate, formatTime } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Horarios de Misa y Eventos · Iglesias de Mérida',
  description: 'Consulta los horarios de misas semanales, celebraciones litúrgicas y eventos públicos de las iglesias de Mérida, Yucatán.',
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default async function HorariosPage() {
  const [churches, schedules, events] = await Promise.all([getChurches(), getMassSchedules(), getPublicEvents()])
  return (
    <PublicShell>
      <PageIntro title="Horarios y eventos" description="Consulta las celebraciones y actividades públicas de la red." />
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 text-primary">
              <Clock className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-normal tracking-tight text-foreground">Misas semanales</h2>
            {schedules.length === 0 ? (
              <div className="mt-6"><EmptyState>Aún no hay horarios publicados.</EmptyState></div>
            ) : (
              <div className="mt-6 divide-y divide-border/60">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{schedule.label}</p>
                      <p className="text-xs text-muted-foreground">{churches.find((church) => church.id === schedule.churchId)?.name}</p>
                    </div>
                    <span className="text-xs font-medium text-gold-text">{DAYS[schedule.weekday]} · {schedule.time} h</span>
                  </div>
                ))}
              </div>
            )}
          </article>
          <article className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 text-primary">
              <CalendarDays className="size-5" aria-hidden />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-normal tracking-tight text-foreground">Próximas fechas</h2>
            {events.length === 0 ? (
              <div className="mt-6"><EmptyState>Aún no hay eventos publicados.</EmptyState></div>
            ) : (
              <div className="mt-6 divide-y divide-border/60">
                {events.map((event) => (
                  <div key={event.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{churches.find((church) => church.id === event.churchId)?.name}</p>
                      </div>
                      <span className="text-right text-xs font-medium text-gold-text">{formatDate(event.date, { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {event.description && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{event.description}</p>}
                    {event.time && <p className="mt-1 text-[0.7rem] text-muted-foreground">{formatTime(event.time)}</p>}
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
