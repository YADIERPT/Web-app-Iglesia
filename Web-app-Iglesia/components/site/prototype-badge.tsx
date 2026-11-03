export function PrototypeBadge() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null

  return (
    <div className="fixed bottom-3 left-3 z-40 rounded-full border border-primary/40 bg-background/95 px-3 py-1 text-xs font-medium text-gold-text shadow-lg backdrop-blur">
      Prototipo · datos de ejemplo
    </div>
  )
}
