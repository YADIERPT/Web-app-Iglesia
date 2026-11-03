'use client'

import Image from 'next/image'
import { ArrowDown, MapPin } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useChurch } from '@/lib/store'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export function Hero() {
  const { settings } = useChurch()
  const now = new Date()
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nextService = settings.schedules
    .map((schedule) => {
      const weekday = weekdays.indexOf(schedule.day)
      const [hours, minutes] = schedule.time.split(':').map(Number)
      const timeInMinutes = hours * 60 + minutes
      let daysUntil = (weekday - now.getDay() + 7) % 7
      if (daysUntil === 0 && timeInMinutes <= currentMinutes) daysUntil = 7
      return { schedule, weekday, timeInMinutes, daysUntil }
    })
    .filter(({ weekday, timeInMinutes }) => weekday >= 0 && timeInMinutes >= 0 && timeInMinutes < 24 * 60)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.timeInMinutes - b.timeInMinutes)[0]?.schedule
  const taglineWords = (settings.tagline.trim() || settings.name.trim() || 'Bienvenido').split(/\s+/)
  const taglineLead = taglineWords.length > 2 ? taglineWords.slice(0, -2).join(' ') : ''
  const taglineHighlight = taglineWords.length > 2 ? taglineWords.slice(-2).join(' ') : taglineWords.join(' ')

  return (
    <section className="relative flex min-h-svh items-end overflow-hidden pb-16 pt-32 md:items-center md:pb-24">
      <Image
        src="/images/hero-church.png"
        alt="Interior del santuario iluminado por la luz del sol"
        fill
        priority
        className="object-cover opacity-90 dark:opacity-60"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="animate-in fade-in slide-in-from-bottom-4 mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary duration-700">
            <span className="h-px w-8 bg-primary/70" />
            Bienvenido a casa
          </p>
          <h1 className="animate-in fade-in slide-in-from-bottom-6 font-serif text-5xl font-normal leading-[1.08] tracking-tight duration-700 md:text-7xl lg:text-8xl">
            {taglineLead && `${taglineLead} `}
            <em className="text-gold-gradient font-normal not-italic">{taglineHighlight}</em>
          </h1>
          {settings.mission && (
            <p className="animate-in fade-in slide-in-from-bottom-8 mt-7 max-w-xl text-base leading-relaxed text-muted-foreground duration-700 md:text-lg">
              {settings.mission}
            </p>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-10 mt-9 flex flex-wrap items-center gap-4 duration-700">
            <a href="#horarios" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-xl px-6 text-sm font-medium shadow-xs transition-transform duration-200 hover:-translate-y-0.5')}>
              Planea tu visita
            </a>
            <a href="#eventos" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-xl border-border/80 bg-background/50 px-6 text-sm font-medium backdrop-blur-xs transition-colors hover:bg-secondary/60')}>
              Próximos eventos
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-border/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          {nextService && (
            <div className="flex items-center gap-4">
              <span className="font-serif text-4xl font-normal text-primary">{formatTime(nextService.time)}</span>
              <span className="text-xs uppercase tracking-wider leading-snug text-muted-foreground">
                Cada {nextService.day.toLowerCase()}
                <br />
                <span className="font-medium text-foreground">{nextService.name}</span>
              </span>
            </div>
          )}
          {settings.address && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden />
              {settings.address}
            </p>
          )}
          <a href="#nosotros" className="hidden items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:flex">
            Descubre más
            <ArrowDown className="size-3.5 text-primary" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  )
}
