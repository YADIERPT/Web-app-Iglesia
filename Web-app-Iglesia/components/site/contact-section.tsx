'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Reveal } from '@/components/reveal'
import { buttonVariants } from '@/components/ui/button'
import { useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ContactSection() {
  const { settings, currentUser, isHydrated } = useChurch()
  const panelHref = isHydrated && currentUser ? '/panel' : '/ingresar'
  const panelLabel = isHydrated && currentUser ? 'Ir al panel' : 'Panel administrativo'
  const items = [
    { icon: MapPin, label: 'Dirección', value: settings.address },
    { icon: Phone, label: 'Teléfono', value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'Correo', value: settings.email, href: `mailto:${settings.email}` },
  ].filter((item) => item.value.trim())

  return (
    <>
      <section id="contacto" className="scroll-mt-24 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-card px-8 py-16 text-center md:px-16 md:py-24">
            <div aria-hidden className="animate-glow pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[100px]" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.35em] text-primary">Visítanos</p>
            <h2 className="relative mx-auto mt-5 max-w-3xl font-serif text-4xl font-medium leading-tight md:text-6xl">
              Las puertas están abiertas, <em className="text-gold-gradient animate-shimmer">y tú eres bienvenido</em>
            </h2>
            <div className="relative mt-14 grid gap-8 text-left md:grid-cols-3">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="mt-1 block hover:text-primary">
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground md:col-span-3">
                  La información de contacto se publicará próximamente.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <BrandMark />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings.name || 'Iglesia'}. Hecho con fe y amor.
          </p>
          <Link href={panelHref} className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
            {panelLabel}
          </Link>
        </div>
      </footer>
    </>
  )
}
