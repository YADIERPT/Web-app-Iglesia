'use client'

import { useChurch } from '@/lib/store'

export function SiteDataStatus() {
  const { dataError } = useChurch()
  if (!dataError) return null

  return (
    <p role="alert" className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-xl rounded-xl border border-destructive/30 bg-background/95 px-4 py-3 text-center text-sm text-muted-foreground shadow-lg backdrop-blur">
      No se pudo actualizar la información del sitio. Inténtalo más tarde.
    </p>
  )
}
