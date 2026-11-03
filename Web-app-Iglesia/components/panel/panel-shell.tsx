'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink, LogOut, Menu } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { initials } from '@/lib/format'
import { canAccess, ROLE_LABELS } from '@/lib/permissions'
import { useChurch } from '@/lib/store'
import { getSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, type NavItem } from './nav-config'
import { demoChurches } from '@/lib/mock/seed'

const NON_CHURCH_SLUGS = new Set([
  'red',
  'archivo',
  'patrimonio',
  'santos',
  'historia',
  'horarios',
  'calendario',
  'intenciones',
  'finanzas',
  'urnas',
  'tarifario',
  'usuarios',
  'comunicados',
  'configuracion',
  'miembros',
  'asistencia',
  'eventos',
  'ministerios',
  'donaciones',
  'reportes',
])

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useChurch()
  const [churchOptions, setChurchOptions] = useState<{ slug: string; name: string }[]>([])
  const [storedSlug, setStoredSlug] = useState<string | null>(null)

  const items = NAV_ITEMS.filter((item) => canAccess(currentUser?.role, item.module) && (!item.networkOnly || currentUser?.isNetworkAdmin))
  
  const firstSegment = pathname.match(/^\/panel\/([^/]+)/)?.[1]
  const routeChurchSlug = firstSegment && !NON_CHURCH_SLUGS.has(firstSegment) ? firstSegment : null

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('iglesias_active_church')
      setStoredSlug(saved)
    }
  }, [])

  useEffect(() => {
    if (routeChurchSlug && typeof window !== 'undefined') {
      window.localStorage.setItem('iglesias_active_church', routeChurchSlug)
      setStoredSlug(routeChurchSlug)
    }
  }, [routeChurchSlug])

  useEffect(() => {
    if (!currentUser || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return
    const client = getSupabaseClient()
    if (!client) return
    const query = client.from('churches').select('slug,name').eq('is_active', true).order('sort_order').order('name')
    void query.then(({ data, error }) => {
      if (error) {
        console.error('No se pudieron cargar las iglesias asignadas:', error)
        return
      }
      const allowed = currentUser.isNetworkAdmin
        ? data
        : data.filter((church) => currentUser.churchSlugs?.includes(church.slug))
      setChurchOptions(allowed)
    })
  }, [currentUser])

  const activeChurchSlug =
    routeChurchSlug ||
    storedSlug ||
    currentUser?.churchSlugs?.[0] ||
    churchOptions[0]?.slug ||
    demoChurches[0]?.slug ||
    'catedral-san-ildefonso'

  const hrefFor = (item: NavItem) => {
    if (item.href === '/panel') {
      return `/panel/${activeChurchSlug}`
    }
    if (item.href === '/panel/red' || item.href === '/panel/red/iglesias') {
      return item.href
    }
    if (item.churchScoped || item.href.includes('[slug]')) {
      return item.href.replace('[slug]', activeChurchSlug)
    }
    return item.href
  }

  const handleSelectChurch = (newSlug: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('iglesias_active_church', newSlug)
      setStoredSlug(newSlug)
    }
    const match = pathname.match(/^\/panel\/[^/]+\/(.+)$/)
    if (match) {
      router.push(`/panel/${newSlug}/${match[1]}`)
    } else {
      router.push(`/panel/${newSlug}`)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <label className="flex flex-col gap-2 px-1 text-xs font-medium text-sidebar-foreground/70">
          Iglesia activa
          <select
            value={activeChurchSlug && demoChurches.some((church) => church.slug === activeChurchSlug) ? activeChurchSlug : demoChurches[0]?.slug}
            onChange={(event) => handleSelectChurch(event.target.value)}
            className="h-10 rounded-lg border border-sidebar-border bg-sidebar-accent px-2 text-sm text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {demoChurches.map((church) => <option key={church.id} value={church.slug}>{church.name}</option>)}
          </select>
        </label>
      )}
      {process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && churchOptions.length > 0 && (
        <label className="flex flex-col gap-2 px-1 text-xs font-medium text-sidebar-foreground/70">
          Iglesia activa
          <select
            value={activeChurchSlug && churchOptions.some((church) => church.slug === activeChurchSlug) ? activeChurchSlug : churchOptions[0]?.slug}
            onChange={(event) => handleSelectChurch(event.target.value)}
            className="h-10 rounded-lg border border-sidebar-border bg-sidebar-accent px-2 text-sm text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {churchOptions.map((church) => <option key={church.slug} value={church.slug}>{church.name}</option>)}
          </select>
        </label>
      )}
      <nav aria-label="Panel" className="flex flex-col gap-1">
      {items.map((item) => {
        const targetHref = hrefFor(item)
        const active =
          item.href === '/panel'
            ? pathname === targetHref || pathname === '/panel'
            : item.href === '/panel/red'
              ? pathname === '/panel/red'
              : pathname === targetHref || (targetHref !== '/panel' && pathname.startsWith(targetHref))

        return (
          <Link
            key={item.label + item.href}
            href={targetHref}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity',
                active ? 'opacity-100' : 'opacity-0',
              )}
            />
            <item.icon className={cn('size-4', active && 'text-primary')} aria-hidden />
            {item.label}
          </Link>
        )
      })}
      </nav>
    </div>
  )
}

function UserCard() {
  const router = useRouter()
  const { currentUser, logout } = useChurch()
  if (!currentUser) return null
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium text-primary">{initials(currentUser.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-sidebar-foreground">{currentUser.name}</p>
        <p className="truncate text-[0.68rem] text-sidebar-primary">{ROLE_LABELS[currentUser.role]}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        onClick={async () => {
          try {
            await logout()
            router.replace('/ingresar')
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.')
          }
        }}
      >
        <LogOut className="size-4" />
        <span className="sr-only">Cerrar sesión</span>
      </Button>
    </div>
  )
}

export function PanelShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser, isHydrated, dataError } = useChurch()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isHydrated && !currentUser && !dataError) router.replace('/ingresar')
  }, [currentUser, dataError, isHydrated, router])

  useEffect(() => {
    if (!isHydrated || !currentUser) return
    if (pathname === '/panel/red' || pathname.startsWith('/panel/red/')) {
      if (!currentUser.isNetworkAdmin) {
        const fallback = currentUser.churchSlugs?.[0] ? `/panel/${currentUser.churchSlugs[0]}` : '/panel'
        if (pathname !== fallback) {
          router.replace(fallback)
        }
      }
      return
    }
    const firstSegment = pathname.match(/^\/panel\/([^/]+)/)?.[1] ?? null
    if (firstSegment && !NON_CHURCH_SLUGS.has(firstSegment)) {
      if (!currentUser.isNetworkAdmin && !currentUser.churchSlugs?.includes(firstSegment)) {
        const fallback = currentUser.churchSlugs?.[0] ? `/panel/${currentUser.churchSlugs[0]}` : '/panel'
        if (pathname !== fallback) {
          router.replace(fallback)
        }
      }
    }
  }, [currentUser, isHydrated, pathname, router])

  if (dataError) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div role="alert" className="max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="font-serif text-2xl">No se pudo cargar el panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">{dataError}</p>
          <Link href="/ingresar" className="mt-4 inline-block text-sm text-primary hover:underline">Volver a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  if (!isHydrated || !currentUser) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="no-print sticky top-0 hidden h-svh w-72 shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <Link href="/" className="px-2 pt-2">
          <BrandMark />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <UserCard />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
                <Menu className="size-5" />
                <span className="sr-only">Abrir menú</span>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col gap-8 bg-sidebar p-5">
                <SheetTitle className="sr-only">Navegación del panel</SheetTitle>
                <BrandMark />
                <div className="flex-1 overflow-y-auto">
                  <SidebarNav onNavigate={() => setOpen(false)} />
                </div>
                <UserCard />
              </SheetContent>
            </Sheet>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Ver sitio
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="relative flex-1 px-4 py-8 md:px-8 md:py-10">
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <div className="mb-6 inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-gold-text">
              Prototipo · datos de ejemplo
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
