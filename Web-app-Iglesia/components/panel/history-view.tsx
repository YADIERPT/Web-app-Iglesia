'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseClient } from '@/lib/supabase'
import { Field } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type HistoryViewProps = {
  churchId: string
  churchName: string
  initialSummary: string | null
  initialHistory: string | null
  initialFoundedYear: number | null
}

export function HistoryView({ churchId, churchName, initialSummary, initialHistory, initialFoundedYear }: HistoryViewProps) {
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [history, setHistory] = useState(initialHistory ?? '')
  const [foundedYear, setFoundedYear] = useState(initialFoundedYear?.toString() ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSummary(initialSummary ?? '')
    setHistory(initialHistory ?? '')
    setFoundedYear(initialFoundedYear?.toString() ?? '')
  }, [initialFoundedYear, initialHistory, initialSummary])

  async function saveHistory() {
    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase no está configurado.')
      return
    }
    setError(null)
    setSaved(false)
    const result = await client.from('churches').update({
      history_summary: summary.trim() || null,
      history_full: history.trim() || null,
      founded_year: foundedYear.trim() ? Number(foundedYear) : null,
    }).eq('id', churchId)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <RequireModule module="historia">
      <PageHeader eyebrow={churchName} title="Historia de la iglesia" description="Edita la información histórica publicada en la ficha de esta iglesia." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Contenido histórico">
          <div className="flex flex-col gap-4">
            <Field label="Año de fundación" htmlFor="history-founded-year">
              <Input id="history-founded-year" type="number" min={0} max={new Date().getFullYear()} value={foundedYear} onChange={(event) => setFoundedYear(event.target.value)} />
            </Field>
            <Field label="Resumen" htmlFor="history-summary">
              <Textarea id="history-summary" rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Resumen breve para la ficha pública." />
            </Field>
            <Field label="Historia completa" htmlFor="history-full">
              <Textarea id="history-full" rows={12} value={history} onChange={(event) => setHistory(event.target.value)} placeholder="Relato histórico completo de la iglesia." />
            </Field>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-end gap-3">
              {saved && <p role="status" className="text-sm text-sage-foreground">Cambios guardados</p>}
              <Button type="button" onClick={() => void saveHistory()}>Guardar historia</Button>
            </div>
          </div>
        </Panel>
        <Panel title="Vista previa">
          {!summary.trim() && !history.trim() ? <EmptyState>Aún no hay historia registrada.</EmptyState> : (
            <article>
              {foundedYear && <p className="text-sm text-muted-foreground">Fundada en {foundedYear}</p>}
              {summary.trim() && <p className="mt-5 text-lg leading-relaxed">{summary}</p>}
              {history.trim() && <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{history}</p>}
            </article>
          )}
        </Panel>
      </div>
    </RequireModule>
  )
}
