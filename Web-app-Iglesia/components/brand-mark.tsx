'use client'

import { Church } from 'lucide-react'
import { useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { settings } = useChurch()
  const [first, ...rest] = (settings.name.trim() || 'Iglesia').split(' ')

  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-card shadow-[0_0_24px_-6px_var(--gold)]">
        {settings.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl || '/placeholder.svg'} alt="" className="size-full object-cover" />
        ) : (
          <Church className="size-5 text-primary" aria-hidden />
        )}
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{first}</span>
          <span className="font-serif text-xl font-semibold tracking-tight">{rest.join(' ')}</span>
        </span>
      )}
    </span>
  )
}
