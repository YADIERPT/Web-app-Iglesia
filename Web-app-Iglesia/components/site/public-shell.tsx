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
    <header className="border-b border-border px-6 pb-12 pt-28 md:px-10 lg:px-16 lg:pt-36">
      <div className="mx-auto max-w-5xl">
        <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">{title}</h1>
        {description && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </header>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">{children}</div>
}

export function Monogram({ name }: { name: string }) {
  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-secondary text-primary">
      <span className="font-serif text-7xl font-semibold">{name.trim().charAt(0) || 'I'}</span>
    </div>
  )
}
