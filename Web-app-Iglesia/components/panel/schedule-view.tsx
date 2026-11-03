'use client'

import { useState } from 'react'
import { Clock3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseClient } from '@/lib/supabase'
import { formatTime, todayISO } from '@/lib/format'
import { AddButton, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule } from './panel-ui'
import { todaysMasses, type ScheduleException as CalculationException } from '@/lib/prototype-calculations'
import type { MassSchedule } from '@/lib/data/models'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
type ScheduleEditor = MassSchedule & { isActive: boolean }
type Exception = CalculationException & { id: string; note: string | null }

export function ScheduleView({ churchName, churchId, schedules: initialSchedules, exceptions: initialExceptions }: {
  churchName: string
  churchId: string
  schedules: MassSchedule[]
  exceptions: Exception[]
}) {
  const [schedules, setSchedules] = useState<ScheduleEditor[]>(initialSchedules.map((schedule) => ({ ...schedule, isActive: true })))
  const [exceptions, setExceptions] = useState<Exception[]>(initialExceptions)
  const [error, setError] = useState<string | null>(null)
  const scheduleEditor = useEditor<ScheduleEditor>()
  const exceptionEditor = useEditor<Exception>()
  const today = todaysMasses(
    schedules.map((schedule) => ({ id: schedule.id, day: DAYS[schedule.weekday], time: schedule.time, name: schedule.label })),
    exceptions,
    new Date(),
  )

  async function reload() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const [scheduleResult, exceptionResult] = await Promise.all([
      client.from('mass_schedules').select('id,church_id,weekday,time,label,language,presider,is_active').eq('church_id', churchId).eq('is_active', true).order('weekday').order('time'),
      client.from('schedule_exceptions').select('id,mass_schedule_id,on_date,action,new_time,note,mass_schedules!inner(church_id)').eq('mass_schedules.church_id', churchId).gte('on_date', todayISO()).order('on_date'),
    ])
    if (scheduleResult.error) throw new Error(scheduleResult.error.message)
    if (exceptionResult.error) throw new Error(exceptionResult.error.message)
    setSchedules((scheduleResult.data ?? []).map((row) => ({ id: row.id, churchId: row.church_id, weekday: row.weekday, time: String(row.time).slice(0, 5), label: row.label, language: row.language, presider: row.presider, isActive: row.is_active })))
    setExceptions((exceptionResult.data ?? []).map((row) => ({ id: row.id, scheduleId: row.mass_schedule_id, date: row.on_date, action: row.action, newTime: row.new_time ? String(row.new_time).slice(0, 5) : undefined, note: row.note })))
  }

  return (
    <RequireModule module="horarios">
      <PageHeader eyebrow={churchName} title="Horarios de misa" description="Configura horarios recurrentes y excepciones por fecha." actions={<AddButton onClick={() => { setError(null); scheduleEditor.create() }}>Nuevo horario</AddButton>} />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Horarios publicados" description="Estos datos provienen de Supabase.">
          {schedules.length === 0 ? <EmptyState>Aún no hay horarios configurados.</EmptyState> : <div className="divide-y divide-border">{schedules.map((schedule) => <div key={schedule.id} className="flex items-center justify-between gap-4 py-4 first:pt-0"><div><p className="font-medium">{schedule.label}</p><p className="mt-1 text-xs text-muted-foreground">{DAYS[schedule.weekday]}{schedule.presider ? ` · ${schedule.presider}` : ''}</p></div><div className="flex items-center gap-3"><span className="text-sm text-gold-text">{formatTime(schedule.time)}{schedule.language === 'maya' ? ' · Maya' : ''}</span><RowActions label={schedule.label} onEdit={() => scheduleEditor.edit(schedule)} onDelete={() => removeSchedule(schedule.id, churchId, setSchedules)} /></div></div>)}</div>}
          <div className="mt-6 border-t border-border pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-serif text-xl">Excepciones</h3><Button variant="outline" size="sm" onClick={() => { setError(null); exceptionEditor.create() }}><Plus data-icon="inline-start" />Agregar</Button></div>{exceptions.length === 0 ? <p className="text-sm text-muted-foreground">No hay cancelaciones o cambios próximos.</p> : <div className="divide-y divide-border">{exceptions.map((exception) => <div key={exception.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{exception.date} · {scheduleLabel(schedules, exception.scheduleId)}</p><p className="text-xs text-muted-foreground">{exception.action === 'cancelar' ? 'Cancelada' : `Movida a ${exception.newTime ? formatTime(exception.newTime) : 'hora nueva'}`}{exception.note ? ` · ${exception.note}` : ''}</p></div><RowActions label={`Excepción del ${exception.date}`} onEdit={() => exceptionEditor.edit(exception)} onDelete={() => removeException(exception.id, setExceptions)} /></div>)}</div>}</div>
        </Panel>
        <Panel title="Misas de hoy" description="Se excluyen las canceladas y se aplica la hora modificada.">
          {today.length === 0 ? <EmptyState><Clock3 className="mx-auto mb-3 size-5" aria-hidden />No hay misas disponibles para hoy.</EmptyState> : <div className="divide-y divide-border">{today.map((mass) => <div key={mass.id} className="flex items-center justify-between py-4 first:pt-0"><span>{mass.name}</span><span className="font-medium text-gold-text">{formatTime(mass.time)}</span></div>)}</div>}
        </Panel>
      </div>
      <FormDialog key={scheduleEditor.editing?.id ?? 'new-schedule'} open={scheduleEditor.open} onOpenChange={scheduleEditor.setOpen} title={scheduleEditor.editing ? 'Editar horario' : 'Nuevo horario'} onSubmit={async (form) => { const client = getSupabaseClient(); if (!client) throw new Error('Supabase no está configurado.'); const values = { weekday: Number(form.get('weekday')), time: String(form.get('time')), label: String(form.get('label')).trim(), language: form.get('language') === 'maya' ? 'maya' : 'es', presider: String(form.get('presider') ?? '').trim() || null, is_active: true }; const result = scheduleEditor.editing ? await client.from('mass_schedules').update(values).eq('id', scheduleEditor.editing.id).eq('church_id', churchId) : await client.from('mass_schedules').insert({ ...values, church_id: churchId }); if (result.error) throw new Error(result.error.message); await reload() }}>
        <Field label="Día" htmlFor="schedule-weekday"><NativeSelect id="schedule-weekday" name="weekday" defaultValue={String(scheduleEditor.editing?.weekday ?? 0)}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</NativeSelect></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Hora" htmlFor="schedule-time"><Input id="schedule-time" name="time" type="time" required defaultValue={scheduleEditor.editing?.time ?? '08:00'} /></Field><Field label="Idioma" htmlFor="schedule-language"><NativeSelect id="schedule-language" name="language" defaultValue={scheduleEditor.editing?.language ?? 'es'}><option value="es">Español</option><option value="maya">Maya</option></NativeSelect></Field></div>
        <Field label="Nombre" htmlFor="schedule-label"><Input id="schedule-label" name="label" required defaultValue={scheduleEditor.editing?.label ?? 'Misa'} /></Field><Field label="Celebrante" htmlFor="schedule-presider"><Input id="schedule-presider" name="presider" defaultValue={scheduleEditor.editing?.presider ?? ''} /></Field>
      </FormDialog>
      <FormDialog key={exceptionEditor.editing?.id ?? 'new-exception'} open={exceptionEditor.open} onOpenChange={exceptionEditor.setOpen} title={exceptionEditor.editing ? 'Editar excepción' : 'Nueva excepción'} onSubmit={async (form) => { const client = getSupabaseClient(); if (!client) throw new Error('Supabase no está configurado.'); const action = form.get('action') as 'cancelar' | 'mover'; const values = { mass_schedule_id: String(form.get('scheduleId')), on_date: String(form.get('date')), action, new_time: action === 'mover' ? String(form.get('newTime')) : null, note: String(form.get('note') ?? '').trim() || null }; const result = exceptionEditor.editing ? await client.from('schedule_exceptions').update(values).eq('id', exceptionEditor.editing.id) : await client.from('schedule_exceptions').insert(values); if (result.error) throw new Error(result.error.message); await reload() }}>
        <Field label="Horario" htmlFor="exception-schedule"><NativeSelect id="exception-schedule" name="scheduleId" required defaultValue={exceptionEditor.editing?.scheduleId ?? ''}><option value="">Selecciona un horario</option>{schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{DAYS[schedule.weekday]} · {formatTime(schedule.time)} · {schedule.label}</option>)}</NativeSelect></Field>
        <Field label="Fecha" htmlFor="exception-date"><Input id="exception-date" name="date" type="date" required defaultValue={exceptionEditor.editing?.date ?? todayISO()} /></Field>
        <Field label="Acción" htmlFor="exception-action"><NativeSelect id="exception-action" name="action" defaultValue={exceptionEditor.editing?.action ?? 'cancelar'}><option value="cancelar">Cancelar</option><option value="mover">Cambiar hora</option></NativeSelect></Field>
        <Field label="Nueva hora (si aplica)" htmlFor="exception-time"><Input id="exception-time" name="newTime" type="time" defaultValue={exceptionEditor.editing?.newTime ?? ''} /></Field>
        <Field label="Nota" htmlFor="exception-note"><Input id="exception-note" name="note" defaultValue={exceptionEditor.editing?.note ?? ''} /></Field>
      </FormDialog>
    </RequireModule>
  )
}

function scheduleLabel(schedules: ScheduleEditor[], id: string) { const schedule = schedules.find((item) => item.id === id); return schedule ? `${DAYS[schedule.weekday]} · ${formatTime(schedule.time)}` : 'Horario' }
async function removeSchedule(id: string, churchId: string, setSchedules: (update: (previous: ScheduleEditor[]) => ScheduleEditor[]) => void) { const client = getSupabaseClient(); if (!client) throw new Error('Supabase no está configurado.'); const result = await client.from('mass_schedules').delete().eq('id', id).eq('church_id', churchId); if (result.error) throw new Error(result.error.message); setSchedules((previous) => previous.filter((schedule) => schedule.id !== id)) }
async function removeException(id: string, setExceptions: (update: (previous: Exception[]) => Exception[]) => void) { const client = getSupabaseClient(); if (!client) throw new Error('Supabase no está configurado.'); const result = await client.from('schedule_exceptions').delete().eq('id', id); if (result.error) throw new Error(result.error.message); setExceptions((previous) => previous.filter((exception) => exception.id !== id)) }
