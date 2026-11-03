'use client'

import { useState } from 'react'
import { Church } from 'lucide-react'
import { useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { settings } = useChurch()
  const [logoError, setLogoError] = useState(false)
  const [first, ...rest] = (settings.name.trim() || 'Iglesia').split(' ')

  const hasCustomLogo = Boolean(settings.logoUrl && !logoError)

  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-secondary/60 shadow-xs">
        {hasCustomLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logoUrl!}
            alt=""
            onError={() => setLogoError(true)}
            className="size-full object-cover"
          />
        ) : (
          <Church className="size-5 text-primary" aria-hidden />
        )}
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{first}</span>
          <span className="font-serif text-lg font-medium tracking-tight text-foreground">{rest.join(' ')}</span>
        </span>
      )}
    </span>
  )
}
