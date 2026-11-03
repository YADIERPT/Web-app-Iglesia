'use client'

import { BookOpen, HandHeart, Music, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useChurch } from '@/lib/store'
import type { MinistryTone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SectionHeading } from './section-heading'

export const TONE_CLASSES: Record<MinistryTone, string> = {
  lavender: 'bg-lavender text-lavender-foreground',
  blush: 'bg-blush text-blush-foreground',
  sage: 'bg-sage text-sage-foreground',
  sky: 'bg-sky text-sky-foreground',
}

export function ministryIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('músic') || n.includes('alaba')) return Music
  if (n.includes('joven')) return Sparkles
  if (n.includes('niñ')) return Users
  if (n.includes('enseñ') || n.includes('estudio')) return BookOpen
  return HandHeart
}

export function MinistriesSection() {
  const { ministries } = useChurch()

  return (
    <section id="ministerios" className="scroll-mt-24 py-24 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Ministerios"
            title={
              <>
                Encuentra tu lugar para <em className="text-primary">servir</em>
              </>
            }
          />
          <Reveal className="max-w-sm text-muted-foreground">
            Cada don tiene un propósito. Únete a un ministerio y crece mientras sirves a otros.
          </Reveal>
        </div>

        {ministries.length > 0 ? (
          <div className="mt-16 grid gap-5 md:grid-cols-6">
            {ministries.map((ministry, index) => {
              const Icon = ministryIcon(ministry.name)
              return (
                <Reveal
                  key={ministry.id}
                  delay={index * 100}
                  className={cn(
                    'group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-20px_var(--gold)]',
                    index < 2 ? 'md:col-span-3' : 'md:col-span-2',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className={cn('flex size-14 items-center justify-center rounded-2xl', TONE_CLASSES[ministry.tone])}>
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="font-serif text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl font-medium">{ministry.name}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{ministry.description}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                      {ministry.memberCount ?? ministry.memberIds.length} integrantes
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        ) : (
          <p className="mt-16 rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
            La información de los ministerios se publicará próximamente.
          </p>
        )}
      </div>
    </section>
  )
}
