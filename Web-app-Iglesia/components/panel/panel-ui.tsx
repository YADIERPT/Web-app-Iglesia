'use client'

import type { ReactNode } from 'react'
import { Lock, type LucideIcon } from 'lucide-react'
import { canAccess, type ModuleKey } from '@/lib/permissions'
import { useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mb-8 flex flex-col justify-between gap-4 duration-700 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>}
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'lavender',
  delay = 0,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  tone?: 'lavender' | 'blush' | 'sage' | 'sky'
  delay?: number
}) {
  const tones = {
    lavender: 'bg-lavender text-lavender-foreground',
    blush: 'bg-blush text-blush-foreground',
    sage: 'bg-sage text-sage-foreground',
    sky: 'bg-sky text-sky-foreground',
  }
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-25px_var(--gold)]"
      style={{ animationDelay: `${delay}ms`, animationDuration: '700ms' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-4 font-serif text-4xl font-medium tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Panel({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-3xl border border-border bg-card p-6', className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-serif text-2xl font-medium">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { currentUser } = useChurch()
  if (canAccess(currentUser?.role, module)) return <>{children}</>
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-primary/30 text-primary">
        <Lock className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-3xl">Acceso restringido</h1>
      <p className="mt-2 text-muted-foreground">Tu rol no tiene permisos para ver este módulo. Contacta al administrador si necesitas acceso.</p>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">{children}</p>
}
