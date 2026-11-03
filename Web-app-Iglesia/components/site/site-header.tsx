'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Archive, CalendarDays, Church, Info, Menu, Search, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Inicio', icon: Church },
  { href: '/archivo', label: 'Archivo', icon: Archive },
  { href: '/patrimonio', label: 'Patrimonio', icon: Sparkles },
  { href: '/horarios', label: 'Horarios y eventos', icon: CalendarDays },
  { href: '/acerca', label: 'Acerca de', icon: Info },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { currentUser, isHydrated } = useChurch()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const accessHref = isHydrated && currentUser ? '/panel' : '/ingresar'
  const accessLabel = isHydrated && currentUser ? 'Ir al panel' : 'Ingresar'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 lg:inset-y-0 lg:right-auto lg:w-64', scrolled && 'bg-sidebar/95 backdrop-blur-xl')}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Saltar al contenido
      </a>
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:h-full lg:flex-col lg:items-stretch lg:border-b-0 lg:px-6 lg:py-8">
        <Link href="/" aria-label="Inicio" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent shadow-xs">
            <Church className="size-4 text-sidebar-primary" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-sidebar-primary">Archivo</span>
            <span className="font-serif text-lg font-medium text-sidebar-foreground">Iglesias de Mérida</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 flex-col gap-1.5 pt-12 lg:flex">
          {LINKS.map((link) => {
            const Icon = link.icon
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground font-semibold shadow-xs'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('size-4', isActive ? 'text-sidebar-primary' : 'text-sidebar-primary/70')} aria-hidden />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1 lg:flex-col lg:items-stretch lg:gap-3">
          <Link href="/buscar" aria-label="Buscar" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground')}>
            <Search className="size-4" aria-hidden />
          </Link>
          <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          <Link href={accessHref} className="hidden border-t border-sidebar-border pt-4 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:text-sidebar-primary lg:block">
            {accessLabel}
          </Link>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden" />}>
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-6 text-sidebar-foreground">
              <SheetTitle className="font-serif text-2xl font-normal">Navegación</SheetTitle>
              <nav aria-label="Móvil" className="mt-6 flex flex-col gap-2">
                {LINKS.map((link) => {
                  const Icon = link.icon
                  const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-lg px-3 text-base transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
                      )}
                    >
                      <Icon className="size-4 text-sidebar-primary" aria-hidden />
                      {link.label}
                    </Link>
                  )
                })}
                <Link href={accessHref} onClick={() => setMenuOpen(false)} className="mt-4 border-t border-sidebar-border pt-4 text-sm text-sidebar-foreground/70">
                  {accessLabel}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
