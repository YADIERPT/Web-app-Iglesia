'use client'

import Image from 'next/image'
import { Quote } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useChurch } from '@/lib/store'
import { SectionHeading } from './section-heading'

export function AboutSection() {
  const { settings, publicMemberCount, ministries } = useChurch()
  const stats = [
    { value: publicMemberCount, label: 'Miembros activos' },
    { value: ministries.length, label: 'Ministerios activos' },
    { value: settings.schedules.length, label: 'Reuniones semanales' },
  ].filter((stat) => stat.value > 0)

  return (
    <section id="nosotros" className="relative scroll-mt-24 py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/80 shadow-xs">
            <Image
              src="/images/community.png"
              alt="Miembros de la iglesia conversando en el jardín"
              fill
              className="object-cover transition-transform duration-700 hover:scale-102"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="absolute -bottom-6 right-2 max-w-[calc(100%-1rem)] rounded-xl border border-border/80 bg-card/95 p-6 shadow-md backdrop-blur-md md:-right-8">
            <Quote className="mb-2 size-5 text-primary" aria-hidden />
            <p className="font-serif text-lg italic leading-snug text-foreground">
              {'"Donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos."'}
            </p>
            <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mateo 18:20</p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Quiénes somos"
            title={
              <>
                Una comunidad que camina <em className="text-primary not-italic">junta</em> en la fe
              </>
            }
            description={settings.vision || undefined}
          />

          {(settings.mission || settings.vision) && (
            <Reveal delay={150} className="grid gap-6 sm:grid-cols-2">
              {settings.mission && (
                <div className="rounded-xl border border-border/60 bg-lavender/60 p-6">
                  <h3 className="font-serif text-xl font-medium text-foreground">Misión</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{settings.mission}</p>
                </div>
              )}
              {settings.vision && (
                <div className="rounded-xl border border-border/60 bg-blush/60 p-6">
                  <h3 className="font-serif text-xl font-medium text-foreground">Visión</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{settings.vision}</p>
                </div>
              )}
            </Reveal>
          )}

          {stats.length > 0 && (
            <Reveal delay={300} className="flex flex-wrap gap-10 border-t border-border/80 pt-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-4xl font-normal text-primary">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
