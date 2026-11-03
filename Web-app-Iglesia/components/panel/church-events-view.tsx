'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatTime, todayISO } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import type { ChurchEvent, EventStatus, EventType } from '@/lib/types'
import { AddButton, Field, FormDialog, NativeSelect, RowActions } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

type ProjectedFeast = { id: string; name: string; date: string; month: number; day: number }

const EVENT_KINDS = [
  { value: 'religioso', label: 'Religioso (general)' },
  { value: 'bautizo', label: 'Bautizo' },
  { value: 'catequesis', label: 'Catequesis' },
  { value: 'confirmacion', label: 'Confirmación' },
  { value: 'primera_comunion', label: 'Primera comunión' },
  { value: 'boda', label: 'Boda' },
  { value: 'confesion', label: 'Confesión' },
  { value: 'fiesta_patronal', label: 'Fiesta patronal' },
  { value: 'procesion', label: 'Procesión' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'evento', label: 'Evento parroquial' },
  { value: 'otro', label: 'Otro' },
]

export function ChurchEventsView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [feasts, setFeasts] = useState<ProjectedFeast[]>([])
  const [editing, setEditing] = useState<ChurchEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEvents() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const [eventsResult, saintsResult] = await Promise.all([
      client
        .from('events')
        .select('id,title,date,time,place,description,responsible,type,status')
        .eq('church_id', churchId)
        .order('date')
        .order('time'),
      client
        .from('saints')
        .select('id,name,feast_day_month,feast_day_day')
        .eq('church_id', churchId)
        .not('feast_day_month', 'is', null)
        .not('feast_day_day', 'is', null),
    ])
    if (eventsResult.error) throw new Error(eventsResult.error.message)
    setEvents((eventsResult.data ?? []) as ChurchEvent[])

    const currentYear = new Date().getFullYear()
    const projected: ProjectedFeast[] = (saintsResult.data ?? []).map((saint) => {
      const monthStr = String(saint.feast_day_month).padStart(2, '0')
      const dayStr = String(saint.feast_day_day).padStart(2, '0')
      return {
        id: saint.id,
        name: saint.name,
        month: saint.feast_day_month,
        day: saint.feast_day_day,
        date: `${currentYear}-${monthStr}-${dayStr}`,
      }
    })
    setFeasts(projected)
  }

  useEffect(() => {
    void loadEvents().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los eventos.'))
  }, [churchId])

  async function removeEvent(event: ChurchEvent) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const result = await client.from('events').delete().eq('id', event.id).eq('church_id', churchId)
    if (result.error) throw new Error(result.error.message)
    setEvents((previous) => previous.filter((item) => item.id !== event.id))
  }

  const upcoming = events.filter((event) => event.date >= todayISO())
  const past = events.filter((event) => event.date < todayISO()).reverse()

  return (
    <RequireModule module="calendario">
      <PageHeader
        eyebrow={churchName}
        title="Calendario"
        description="Programa bautizos, catequesis, fiestas y actividades de esta iglesia."
        actions={<AddButton onClick={() => { setEditing(null); setError(null); setOpen(true) }}>Nuevo evento</AddButton>}
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <EventPanel title="Próximos eventos" events={upcoming} onEdit={(event) => { setEditing(event); setOpen(true) }} onDelete={removeEvent} />
        <EventPanel title="Eventos pasados" events={past} onEdit={(event) => { setEditing(event); setOpen(true) }} onDelete={removeEvent} />
      </div>
      {feasts.length > 0 && (
        <div className="mt-6">
          <Panel title="Fiestas patronales proyectadas" description="Fechas litúrgicas de santos que se proyectan automáticamente en el calendario.">
            <div className="divide-y divide-border">
              {feasts.map((feast) => (
                <div key={feast.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-serif text-lg font-semibold">Fiesta de {feast.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(feast.date, { day: 'numeric', month: 'long' })}</p>
                  </div>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-gold-text">Patrono / Imagen</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
      <FormDialog
        key={editing?.id ?? 'new'}
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Editar evento' : 'Nuevo evento'}
        onSubmit={async (form) => {
          const client = getSupabaseClient()
          if (!client) throw new Error('Supabase no está configurado.')
          const values = {
            title: String(form.get('title') ?? '').trim(),
            date: String(form.get('date') ?? ''),
            time: String(form.get('time') ?? ''),
            place: String(form.get('place') ?? '').trim(),
            description: String(form.get('description') ?? '').trim(),
            responsible: String(form.get('responsible') ?? '').trim(),
            type: form.get('type') as EventType,
            status: form.get('status') as EventStatus,
          }
          const result = editing
            ? await client.from('events').update(values).eq('id', editing.id).eq('church_id', churchId)
            : await client.from('events').insert({ ...values, church_id: churchId })
          if (result.error) throw new Error(result.error.message)
          await loadEvents()
        }}
      >
        <Field label="Nombre del evento" htmlFor="church-event-title"><Input id="church-event-title" name="title" required defaultValue={editing?.title ?? ''} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha" htmlFor="church-event-date"><Input id="church-event-date" name="date" type="date" required defaultValue={editing?.date ?? todayISO()} /></Field>
          <Field label="Hora" htmlFor="church-event-time"><Input id="church-event-time" name="time" type="time" required defaultValue={editing?.time ?? '18:00'} /></Field>
          <Field label="Lugar" htmlFor="church-event-place"><Input id="church-event-place" name="place" required defaultValue={editing?.place ?? ''} /></Field>
          <Field label="Responsable" htmlFor="church-event-responsible"><Input id="church-event-responsible" name="responsible" required defaultValue={editing?.responsible ?? ''} /></Field>
          <Field label="Tipo" htmlFor="church-event-type">
            <NativeSelect id="church-event-type" name="type" defaultValue={editing?.type ?? 'religioso'}>
              {EVENT_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Estado" htmlFor="church-event-status"><NativeSelect id="church-event-status" name="status" defaultValue={editing?.status ?? 'programado'}><option value="programado">Programado</option><option value="cancelado">Cancelado</option></NativeSelect></Field>
        </div>
        <Field label="Descripción" htmlFor="church-event-description"><Textarea id="church-event-description" name="description" rows={3} defaultValue={editing?.description ?? ''} /></Field>
      </FormDialog>
    </RequireModule>
  )
}

function EventPanel({ title, events, onEdit, onDelete }: { title: string; events: ChurchEvent[]; onEdit: (event: ChurchEvent) => void; onDelete: (event: ChurchEvent) => Promise<void> }) {
  return (
    <Panel title={title}>
      {events.length === 0 ? <EmptyState><CalendarDays className="mx-auto mb-3 size-5" aria-hidden />No hay eventos en esta vista.</EmptyState> : (
        <div className="divide-y divide-border">
          {events.map((event) => (
            <article key={event.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
              <div>
                <h2 className={`font-serif text-xl font-semibold ${event.status === 'cancelado' ? 'line-through opacity-60' : ''}`}>{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(event.time)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.place} · {event.type}</p>
                {event.status === 'cancelado' && <p className="mt-1 text-xs text-destructive">Cancelado</p>}
              </div>
              <RowActions label={event.title} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} />
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
