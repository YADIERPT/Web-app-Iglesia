'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChurch } from '@/lib/store'

export function AuthCard() {
  const router = useRouter()
  const { login, settings, currentUser, isHydrated, dataError } = useChurch()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  useEffect(() => {
    if (isHydrated && currentUser) router.replace('/panel')
  }, [currentUser, isHydrated, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    try {
      const result = await login(email, password)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo iniciar sesión.')
      } else {
        router.replace('/panel')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/hero-church.png" alt="" fill priority className="object-cover" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[oklch(0.85_0.1_85)]">Salmo 133:1</p>
          <p className="mt-4 max-w-md font-serif text-4xl italic leading-tight">
            {'"¡Mirad cuán bueno y cuán delicioso es habitar los hermanos juntos en armonía!"'}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            Volver al sitio
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <BrandMark className="mb-10" />
          <h1 className="font-serif text-4xl font-medium">Bienvenido de nuevo</h1>
          <p className="mt-2 text-muted-foreground">Ingresa con tu correo y contraseña para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" className="h-11" placeholder="tu@correo.com" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            {(error || dataError) && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error || dataError}
              </p>
            )}
            <Button type="submit" disabled={submitting} size="lg" className="h-11 rounded-full text-base">
              {submitting ? 'Verificando…' : 'Iniciar sesión'}
            </Button>
          </form>

          {demoMode && (
            <div className="mt-8 rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-sm font-semibold">Modo prototipo</p>
              <p className="mt-1 text-xs text-muted-foreground">Estas entradas son solo para recorrer la interfaz.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ['Administrador', 'administrador'],
                  ['Archivista', 'archivista'],
                  ['Tesorero', 'tesorero'],
                  ['Consulta', 'consulta'],
                ].map(([label, key]) => (
                  <Button key={key} type="button" variant="outline" size="sm" onClick={async () => {
                    const result = await login(`${key}@demo.test`, 'demo')
                    if (result.ok) router.replace('/panel')
                  }}>
                    Entrar como {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Las cuentas se crean mediante el administrador de la iglesia. Si necesitas acceso o recuperar tu contraseña, contáctalo.
          </p>
        </div>
        {settings.name && <p className="text-center text-xs text-muted-foreground">{settings.name}</p>}
      </div>
    </div>
  )
}
