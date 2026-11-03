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
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-7">
            <Clock className="size-6 text-primary" aria-hidden />
            <h2 className="mt-5 font-serif text-3xl font-semibold">Misas semanales</h2>
            {schedules.length === 0 ? <div className="mt-8"><EmptyState>Aún no hay horarios publicados.</EmptyState></div> : <div className="mt-8 divide-y divide-border">{schedules.map((schedule) => <div key={schedule.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium">{schedule.label}</p><p className="text-sm text-muted-foreground">{churches.find((church) => church.id === schedule.churchId)?.name}</p></div><span className="text-gold-text">{DAYS[schedule.weekday]} · {schedule.time} h</span></div>)}</div>}
          </article>
          <article className="rounded-xl border border-border bg-card p-7">
            <CalendarDays className="size-6 text-primary" aria-hidden />
            <h2 className="mt-5 font-serif text-3xl font-semibold">Próximas fechas</h2>
            {events.length === 0 ? <div className="mt-8"><EmptyState>Aún no hay eventos publicados.</EmptyState></div> : <div className="mt-8 divide-y divide-border">{events.map((event) => <div key={event.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{churches.find((church) => church.id === event.churchId)?.name}</p></div><span className="text-right text-sm text-gold-text">{formatDate(event.date, { day: 'numeric', month: 'short' })}</span></div><p className="mt-2 text-sm text-muted-foreground">{event.description}</p>{event.time && <p className="mt-2 text-xs text-muted-foreground">{formatTime(event.time)}</p>}</div>)}</div>}
          </article>
        </div>
      </section>
    </PublicShell>
  )
}
