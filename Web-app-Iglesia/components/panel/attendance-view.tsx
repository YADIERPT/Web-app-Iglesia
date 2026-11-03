'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatDate, initials, todayISO } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ExportButtons, Field, NativeSelect, RowActions } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'

export function AttendanceView() {
  const { events, members, attendance, save, remove } = useChurch()
  const eventOptions = useMemo(
    () => events.filter((event) => event.status === 'programado').sort((a, b) => b.date.localeCompare(a.date)),
    [events],
  )
  const defaultEventId = useMemo(
    () =>
      [...eventOptions].filter((event) => event.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date))[0]?.id ??
      eventOptions[0]?.id ??
      '',
    [eventOptions],
  )

  const [eventId, setEventId] = useState('')
  const [date, setDate] = useState(todayISO())
  const existing = attendance.find((a) => a.eventId === eventId && a.date === date)
  const existingPresentIds = new Set(existing?.presentIds ?? [])
  const attendanceMembers = members
    .filter((member) => member.active || existingPresentIds.has(member.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  const [selected, setSelected] = useState<Set<string>>(new Set(existing?.presentIds))
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventOptions.some((event) => event.id === eventId)) setEventId(defaultEventId)
  }, [defaultEventId, eventId, eventOptions])

  const loadKey = `${eventId}-${date}`
  const [loadedKey, setLoadedKey] = useState(loadKey)
  if (loadedKey !== loadKey) {
    setLoadedKey(loadKey)
    setSelected(new Set(existing?.presentIds))
    setSavedAt(null)
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    if (!eventOptions.some((event) => event.id === eventId)) return
    setSaveError(null)
    try {
      await save('attendance', { id: existing?.id ?? newId(), eventId, date, presentIds: [...selected] })
      setSavedAt(new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }))
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la asistencia.')
    }
  }

  const history = useMemo(
    () =>
      [...attendance]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((r) => ({ ...r, event: events.find((e) => e.id === r.eventId) })),
    [attendance, events],
  )
  const headers = ['Fecha', 'Evento', 'Asistentes', 'Porcentaje']
  const rows = history.map((r) => [
    formatDate(r.date),
    r.event?.title ?? 'Evento eliminado',
    r.presentIds.length,
    `${Math.round((r.presentIds.length / Math.max(members.length, 1)) * 100)}%`,
  ])

  return (
    <RequireModule module="asistencia">
      <PageHeader
        eyebrow="Registro"
        title="Asistencia"
        description="Marca a los miembros presentes en cada reunión."
        actions={<ExportButtons filename="asistencia" title="Historial de asistencia" subtitle={`${history.length} reuniones`} headers={headers} rows={rows} />}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Evento" htmlFor="a-event">
              <NativeSelect id="a-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {eventOptions.length > 0 ? eventOptions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {formatDate(event.date, { day: 'numeric', month: 'short' })}
                    </option>
                  )) : <option value="">No hay eventos programados</option>}
              </NativeSelect>
            </Field>
            <Field label="Fecha" htmlFor="a-date">
              <Input id="a-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-serif text-3xl text-primary">{selected.size}</span> / {attendanceMembers.length} presentes
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(attendanceMembers.map((m) => m.id)))}>
                Todos
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Ninguno
              </Button>
            </div>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {attendanceMembers.length > 0 ? attendanceMembers.map((member) => {
              const checked = selected.has(member.id)
              return (
                <li key={member.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all duration-300',
                      checked ? 'border-primary/50 bg-accent' : 'border-border hover:bg-muted',
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(member.id)} />
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(member.name)}</span>
                    <span className="text-sm font-medium">{member.name}{member.active ? '' : ' (inactivo)'}</span>
                  </label>
                </li>
              )
            }) : (
              <li className="sm:col-span-2">
                <EmptyState>No hay miembros activos para registrar.</EmptyState>
              </li>
            )}
          </ul>

          <div className="mt-6 flex items-center justify-end gap-4">
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            {savedAt && (
              <p role="status" className="flex items-center gap-1.5 text-sm text-sage-foreground">
                <Check className="size-4" aria-hidden /> Guardado a las {savedAt}
              </p>
            )}
            <Button onClick={handleSave} disabled={!eventOptions.some((event) => event.id === eventId)} className="rounded-full">
              {existing ? 'Actualizar asistencia' : 'Guardar asistencia'}
            </Button>
          </div>
        </Panel>

        <Panel title="Historial" className="xl:col-span-2">
          {history.length === 0 ? (
            <EmptyState>Aún no hay registros.</EmptyState>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {history.slice(0, 10).map((record) => {
                const pct = Math.round((record.presentIds.length / Math.max(members.length, 1)) * 100)
                return (
                  <li key={record.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{record.event?.title ?? 'Evento eliminado'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="font-serif text-2xl">{record.presentIds.length}</span>
                    <RowActions label={`registro del ${formatDate(record.date)}`} onDelete={() => remove('attendance', record.id)} />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </RequireModule>
  )
}
