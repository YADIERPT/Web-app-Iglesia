'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface ChurchItem {
  id: string
  name: string
}

interface ChurchFilterSelectProps {
  churches: ChurchItem[]
  selectedChurch?: string
  category?: string
}

export function ChurchFilterSelect({
  churches,
  selectedChurch,
  category,
}: ChurchFilterSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(churchId: string) {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (churchId) {
      params.set('iglesia', churchId)
    } else {
      params.delete('iglesia')
    }
    if (category && category !== 'todos') {
      params.set('categoria', category)
    } else {
      params.delete('categoria')
    }
    const qs = params.toString()
    router.push(qs ? `/patrimonio?${qs}` : '/patrimonio')
  }

  return (
    <select
      name="iglesia"
      value={selectedChurch ?? ''}
      onChange={(e) => handleSelect(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Filtrar por iglesia"
    >
      <option value="">Todas las iglesias</option>
      {churches.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
