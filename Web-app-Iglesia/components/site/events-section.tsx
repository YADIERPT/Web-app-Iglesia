'use client'

import { Clock, MapPin, Megaphone } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useChurch } from '@/lib/store'
import { formatDate, formatTime, parseISODate, todayISO } from '@/lib/format'
import { SectionHeading } from './section-heading'

export function EventsSection() {
  const { events, announcements } = useChurch()
  const today = todayISO()
  const upcoming = events
    .filter((e) => e.date >= today && e.status === 'programado')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)
  const notices = [...announcements].sort((a, b) => Number(b.important) - Number(a.important) || b.date.localeCompare(a.date)).slice(0, 3)

  return (
    <section id="eventos" className="relative scroll-mt-24 bg-muted/50 py-24 md:py-36">
      <div aria-hidden className="gold-hairline absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionHeading eyebrow="Agenda" title="Próximos eventos" />
          {upcoming.length > 0 ? (
            <ul className="mt-12 flex flex-col">
              {upcoming.map((event, index) => {
                const date = parseISODate(event.date)
                return (
                  <Reveal as="li" key={event.id} delay={index * 100}>
                    <article className="group flex gap-6 border-b border-border py-7 transition-colors md:gap-10">
                      <div className="flex w-16 shrink-0 flex-col items-center">
                        <span className="font-serif text-5xl leading-none text-primary transition-transform duration-500 group-hover:scale-110">
                          {date.getDate()}
                        </span>
                        <time dateTime={event.date} className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)}
                        </time>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-2xl font-medium transition-colors group-hover:text-primary md:text-3xl">{event.title}</h3>
                        <p className="mt-2 text-muted-foreground">{event.description}</p>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <time dateTime={`${event.date}T${event.time}`} className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-primary" aria-hidden />
                            {formatDate(event.date, { weekday: 'long' })}, {formatTime(event.time)}
                          </time>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary" aria-hidden />
                            {event.place}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                )
              })}
            </ul>
          ) : (
            <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
              No hay eventos próximos publicados.
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionHeading eyebrow="Avisos" title="Comunicados" />
          <div className="mt-12 flex flex-col gap-5">
            {notices.length > 0 ? (
              notices.map((notice, index) => (
                <Reveal
                  key={notice.id}
                  delay={index * 120}
                  className="rounded-3xl border border-border bg-card p-7 transition-shadow duration-500 hover:shadow-[0_20px_60px_-25px_var(--gold)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time dateTime={notice.date} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{formatDate(notice.date)}</time>
                    {notice.important && (
                      <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        <Megaphone className="size-3" aria-hidden />
                        Importante
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-medium">{notice.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
                </Reveal>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
                No hay comunicados publicados por el momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
