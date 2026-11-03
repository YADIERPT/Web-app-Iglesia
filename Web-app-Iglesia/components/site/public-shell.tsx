import type { ReactNode } from 'react'
import { PrototypeBadge } from '@/components/site/prototype-badge'
import { SiteHeader } from '@/components/site/site-header'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PrototypeBadge />
      <main id="contenido" className="min-h-svh lg:ml-64">{children}</main>
    </>
  )
}

export function PageIntro({ title, description }: { title: string; description?: string }) {
  return (
    <header className="border-b border-border/80 px-6 pb-12 pt-24 md:px-10 lg:px-16 lg:pt-32">
      <div className="mx-auto max-w-5xl">
        <h1 className="max-w-3xl font-serif text-4xl font-normal leading-[1.1] tracking-tight text-foreground md:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>}
      </div>
    </header>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border/80 bg-secondary/30 px-6 py-12 text-center text-sm text-muted-foreground">{children}</div>
}

export function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0) || 'I'
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center bg-secondary/60 p-6 text-foreground select-none">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-background/80 shadow-xs">
        <span className="font-serif text-2xl font-medium text-primary">{initial}</span>
      </div>
      <span className="mt-3 max-w-[85%] truncate text-center font-serif text-xs font-medium tracking-wide text-muted-foreground">
        {name}
      </span>
    </div>
  )
}
