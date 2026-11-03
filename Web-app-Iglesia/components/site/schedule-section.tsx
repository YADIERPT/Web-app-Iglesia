'use client'

import { Clock } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useChurch } from '@/lib/store'
import { formatTime } from '@/lib/format'
import { SectionHeading } from './section-heading'

export function ScheduleSection() {
  const { settings } = useChurch()

  return (
    <section id="horarios" className="relative scroll-mt-24 overflow-hidden bg-muted/50 py-24 md:py-32">
      <div aria-hidden className="gold-hairline absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          align="center"
          eyebrow="Horarios"
          title="Te esperamos cada semana"
          description="Hay un lugar para ti. Llega unos minutos antes y alguien de nuestro equipo te dará la bienvenida."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {settings.schedules.length > 0 ? (
            settings.schedules.map((schedule, index) => (
              <Reveal
                key={schedule.id}
                delay={index * 120}
                className="group relative flex flex-col gap-8 bg-card p-8 transition-colors duration-500 hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{schedule.day}</span>
                  <Clock className="size-4 text-primary transition-transform duration-500 group-hover:rotate-45" aria-hidden />
                </div>
                <div>
                  <p className="font-serif text-5xl font-medium text-primary">{formatTime(schedule.time)}</p>
                  <p className="mt-3 text-lg">{schedule.name}</p>
                </div>
              </Reveal>
            ))
          ) : (
            <p className="col-span-full bg-card px-6 py-12 text-center text-muted-foreground">
              Los horarios se publicarán próximamente.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
