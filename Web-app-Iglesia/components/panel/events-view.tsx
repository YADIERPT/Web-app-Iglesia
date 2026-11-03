'use client'

import { Clock, MapPin, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatTime, parseISODate, todayISO } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import type { ChurchEvent, EventStatus, EventType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AddButton, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, RequireModule } from './panel-ui'

function EventList({ events, onEdit, onDelete }: { events: ChurchEvent[]; onEdit: (e: ChurchEvent) => void; onDelete: (id: string) => void }) {
  if (events.length === 0) return <EmptyState>No hay eventos en esta vista.</EmptyState>
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event) => {
        const date = parseISODate(event.date)
        return (
          <article
            key={event.id}
            className={cn(
              'group flex gap-5 rounded-3xl border border-border bg-card p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_20px_50px_-30px_var(--gold)]',
              event.status === 'cancelado' && 'opacity-60',
            )}
          >
            <div className="flex w-14 shrink-0 flex-col items-center">
              <span className="font-serif text-4xl leading-none text-primary">{date.getDate()}</span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                  {event.status === 'cancelado' && <Badge variant="destructive">Cancelado</Badge>}
                </div>
                <RowActions label={event.title} onEdit={() => onEdit(event)} onDelete={() => onDelete(event.id)} />
              </div>
              <h3 className={cn('mt-2 font-serif text-2xl font-medium', event.status === 'cancelado' && 'line-through')}>{event.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="size-3.5 text-primary" aria-hidden />
                  {formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTime(event.time)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" aria-hidden />
                  {event.place}
                </span>
                <span className="flex items-center gap-2">
                  <User className="size-3.5 text-primary" aria-hidden />
                  {event.responsible}
                </span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function EventsView() {
  const { events, save, remove } = useChurch()
  const editor = useEditor<ChurchEvent>()
  const today = todayISO()
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const handleDelete = (id: string) => remove('events', id)

  return (
    <RequireModule module="eventos">
      <PageHeader eyebrow="Agenda" title="Eventos" description="Programa cultos, reuniones y actividades." actions={<AddButton onClick={editor.create}>Nuevo evento</AddButton>} />

      <Tabs defaultValue="proximos">
        <TabsList className="mb-6">
          <TabsTrigger value="proximos">Próximos ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="pasados">Pasados ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="proximos">
          <EventList events={upcoming} onEdit={editor.edit} onDelete={handleDelete} />
        </TabsContent>
        <TabsContent value="pasados">
          <EventList events={past} onEdit={editor.edit} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>

      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar evento' : 'Nuevo evento'}
        onSubmit={async (form) =>
          await save('events', {
            id: editor.editing?.id ?? newId(),
            title: String(form.get('title')),
            date: String(form.get('date')),
            time: String(form.get('time')),
            place: String(form.get('place')),
            description: String(form.get('description')),
            responsible: String(form.get('responsible')),
            type: form.get('type') as EventType,
            status: form.get('status') as EventStatus,
          })
        }
      >
        <Field label="Nombre del evento" htmlFor="e-title">
          <Input id="e-title" name="title" required defaultValue={editor.editing?.title} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha" htmlFor="e-date">
            <Input id="e-date" name="date" type="date" required defaultValue={editor.editing?.date ?? today} />
          </Field>
          <Field label="Hora" htmlFor="e-time">
            <Input id="e-time" name="time" type="time" required defaultValue={editor.editing?.time ?? '18:00'} />
          </Field>
          <Field label="Lugar" htmlFor="e-place">
            <Input id="e-place" name="place" required defaultValue={editor.editing?.place ?? 'Santuario principal'} />
          </Field>
          <Field label="Responsable" htmlFor="e-resp">
            <Input id="e-resp" name="responsible" required defaultValue={editor.editing?.responsible} />
          </Field>
          <Field label="Tipo" htmlFor="e-type">
            <NativeSelect id="e-type" name="type" defaultValue={editor.editing?.type ?? 'religioso'}>
              <option value="religioso">Religioso</option>
              <option value="administrativo">Administrativo</option>
            </NativeSelect>
          </Field>
          <Field label="Estado" htmlFor="e-status">
            <NativeSelect id="e-status" name="status" defaultValue={editor.editing?.status ?? 'programado'}>
              <option value="programado">Programado</option>
              <option value="cancelado">Cancelado</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label="Descripción" htmlFor="e-desc">
          <Textarea id="e-desc" name="description" rows={3} defaultValue={editor.editing?.description} />
        </Field>
      </FormDialog>
    </RequireModule>
  )
}
