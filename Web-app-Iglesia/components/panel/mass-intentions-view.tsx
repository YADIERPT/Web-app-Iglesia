'use client'

import { useEffect, useMemo, useState } from 'react'
import { Printer, ScrollText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatTime, monthKey, monthLabel, todayISO } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { AddButton, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule, StatCard } from './panel-ui'

type Intention = {
  id: string
  massScheduleId: string | null
  massDate: string
  massTime: string
  intentionType: string
  honoreeName: string
  requestedBy: string
  contactPhone: string
  stipendMxn: number
  paid: boolean
  isMentionedInMass: boolean
  notes: string
}

type MassSchedule = {
  id: string
  weekday: number
  time: string
  label: string
}

type ScheduleException = {
  id: string
  massScheduleId: string
  onDate: string
  action: 'cancelar' | 'mover'
  newTime: string | null
  note: string | null
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function MassIntentionsView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [intentions, setIntentions] = useState<Intention[]>([])
  const [schedules, setSchedules] = useState<MassSchedule[]>([])
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [month, setMonth] = useState(monthKey(todayISO()))
  const [error, setError] = useState<string | null>(null)
  const editor = useEditor<Intention>()

  async function loadData() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')
    const [intentionResult, scheduleResult, exceptionResult] = await Promise.all([
      client
        .from('mass_intentions')
        .select('id,mass_schedule_id,mass_date,mass_time,intention_type,honoree_name,requested_by,contact_phone,stipend_mxn,paid,is_mentioned_in_mass,notes')
        .eq('church_id', churchId)
        .order('mass_date')
        .order('mass_time'),
      client.from('mass_schedules').select('id,weekday,time,label').eq('church_id', churchId).eq('is_active', true).order('weekday').order('time'),
      client
        .from('schedule_exceptions')
        .select('id,mass_schedule_id,on_date,action,new_time,note,mass_schedules!inner(church_id)')
        .eq('mass_schedules.church_id', churchId),
    ])
    if (intentionResult.error) throw new Error(intentionResult.error.message)
    if (scheduleResult.error) throw new Error(scheduleResult.error.message)
    if (exceptionResult.error) throw new Error(exceptionResult.error.message)
    setIntentions((intentionResult.data ?? []).map((row) => ({
      id: row.id,
      massScheduleId: row.mass_schedule_id,
      massDate: row.mass_date,
      massTime: String(row.mass_time ?? '').slice(0, 5),
      intentionType: row.intention_type,
      honoreeName: row.honoree_name,
      requestedBy: row.requested_by ?? '',
      contactPhone: row.contact_phone ?? '',
      stipendMxn: Number(row.stipend_mxn ?? 0),
      paid: row.paid,
      isMentionedInMass: row.is_mentioned_in_mass,
      notes: row.notes ?? '',
    })))
    setSchedules((scheduleResult.data ?? []).map((row) => ({
      id: row.id,
      weekday: row.weekday,
      time: String(row.time).slice(0, 5),
      label: row.label,
    })))
    setExceptions((exceptionResult.data ?? []).map((row) => ({
      id: row.id,
      massScheduleId: row.mass_schedule_id,
      onDate: row.on_date,
      action: row.action as 'cancelar' | 'mover',
      newTime: row.new_time ? String(row.new_time).slice(0, 5) : null,
      note: row.note,
    })))
  }

  useEffect(() => {
    void loadData().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las intenciones.'))
  }, [churchId])

  const months = useMemo(() => [...new Set(intentions.map((intention) => monthKey(intention.massDate)))].sort().reverse(), [intentions])
  const filtered = intentions.filter((intention) => monthKey(intention.massDate) === month)
  const paidTotal = filtered.filter((intention) => intention.paid).reduce((total, intention) => total + intention.stipendMxn, 0)
  const pendingTotal = filtered.filter((intention) => !intention.paid).reduce((total, intention) => total + intention.stipendMxn, 0)

  return (
    <RequireModule module="intenciones">
      <PageHeader
        eyebrow={churchName}
        title="Intenciones de misa"
        description="Registra intenciones, estipendios y la hoja de misa de esta iglesia."
        actions={
          <>
            <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:bg-accent" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden />
              Imprimir hoja
            </button>
            <AddButton onClick={() => { setError(null); editor.create() }}>Nueva intención</AddButton>
          </>
        }
      />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Intenciones del mes" value={filtered.length} icon={ScrollText} tone="sky" />
        <StatCard label="Estipendios pagados" value={formatCurrency(paidTotal)} icon={ScrollText} tone="sage" />
        <StatCard label="Pendiente de pago" value={formatCurrency(pendingTotal)} icon={ScrollText} tone="blush" />
      </div>
      <Panel
        title="Hoja de misa"
        description="Solo se muestran las intenciones marcadas para mencionarse en misa."
        actions={
          <NativeSelect value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Mes" className="w-full capitalize sm:w-48">
            {months.length > 0 ? months.map((value) => <option key={value} value={value}>{monthLabel(value)}</option>) : <option value={month}>{monthLabel(month)} · sin registros</option>}
          </NativeSelect>
        }
      >
        {filtered.filter((intention) => intention.isMentionedInMass).length === 0 ? (
          <EmptyState>No hay intenciones para este mes.</EmptyState>
        ) : (
          <div className="divide-y divide-border print-sheet">
            {filtered.filter((intention) => intention.isMentionedInMass).map((intention) => (
              <article key={intention.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                <div>
                  <h2 className="font-serif text-xl font-semibold">{intention.honoreeName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{intention.intentionType} · {formatDate(intention.massDate)} · {intention.massTime ? formatTime(intention.massTime) : 'Hora por definir'}</p>
                  {intention.notes && <p className="mt-1 text-sm text-muted-foreground">{intention.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${intention.paid ? 'border-sage bg-sage/30' : 'border-border'}`}>
                    {intention.paid ? 'Pagado' : 'Pendiente'}
                  </span>
                  <RowActions label={intention.honoreeName} onEdit={() => editor.edit(intention)} onDelete={() => removeIntention(intention.id, churchId, setIntentions)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
      <IntentionFormModal
        key={editor.editing?.id ?? (editor.open ? 'open' : 'closed')}
        open={editor.open}
        onOpenChange={editor.setOpen}
        editing={editor.editing}
        schedules={schedules}
        exceptions={exceptions}
        churchId={churchId}
        onSaved={loadData}
      />
    </RequireModule>
  )
}

function IntentionFormModal({
  open,
  onOpenChange,
  editing,
  schedules,
  exceptions,
  churchId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Intention | null
  schedules: MassSchedule[]
  exceptions: ScheduleException[]
  churchId: string
  onSaved: () => Promise<void>
}) {
  const [massDate, setMassDate] = useState(editing?.massDate ?? todayISO())
  const [massTime, setMassTime] = useState(editing?.massTime ?? '')
  const [selectedScheduleId, setSelectedScheduleId] = useState(editing?.massScheduleId ?? '')

  useEffect(() => {
    setMassDate(editing?.massDate ?? todayISO())
    setMassTime(editing?.massTime ?? '')
    setSelectedScheduleId(editing?.massScheduleId ?? '')
  }, [editing, open])

  const selectedWeekday = useMemo(() => {
    if (!massDate) return -1
    const [y, m, d] = massDate.split('-').map(Number)
    if (!y || !m || !d) return -1
    return new Date(y, m - 1, d).getDay()
  }, [massDate])

  const availableSchedules = useMemo(() => {
    if (selectedWeekday === -1) return []
    return schedules
      .filter((s) => s.weekday === selectedWeekday)
      .map((s) => {
        const exception = exceptions.find((ex) => ex.massScheduleId === s.id && ex.onDate === massDate)
        const isCancelled = exception?.action === 'cancelar'
        const effectiveTime = exception?.action === 'mover' && exception.newTime ? exception.newTime : s.time
        const isMoved = exception?.action === 'mover'
        return {
          ...s,
          isCancelled,
          effectiveTime,
          isMoved,
          labelDisplay: `${WEEKDAYS[s.weekday]} · ${formatTime(effectiveTime)} · ${s.label}${isMoved ? ' (Hora cambiada)' : ''}`,
        }
      })
      .filter((s) => !s.isCancelled || s.id === editing?.massScheduleId)
  }, [schedules, exceptions, massDate, selectedWeekday, editing])

  function handleScheduleChange(scheduleId: string) {
    setSelectedScheduleId(scheduleId)
    const match = availableSchedules.find((s) => s.id === scheduleId)
    if (match) {
      setMassTime(match.effectiveTime)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar intención' : 'Nueva intención'}
      description="La intención quedará asociada a la iglesia activa."
      onSubmit={async (form) => {
        const client = getSupabaseClient()
        if (!client) throw new Error('Supabase no está configurado.')
        const massScheduleId = String(form.get('massScheduleId') ?? '')
        const values = {
          mass_date: String(form.get('massDate') ?? ''),
          mass_time: String(form.get('massTime') ?? '') || null,
          intention_type: String(form.get('intentionType') ?? '').trim(),
          honoree_name: String(form.get('honoreeName') ?? '').trim(),
          requested_by: String(form.get('requestedBy') ?? '').trim() || null,
          contact_phone: String(form.get('contactPhone') ?? '').trim() || null,
          stipend_mxn: Math.max(0, Number(form.get('stipendMxn') ?? 0)),
          paid: form.get('paid') === 'on',
          is_mentioned_in_mass: form.get('isMentionedInMass') === 'on',
          notes: String(form.get('notes') ?? '').trim() || null,
          mass_schedule_id: massScheduleId || null,
        }
        const result = editing
          ? await client.from('mass_intentions').update(values).eq('id', editing.id).eq('church_id', churchId)
          : await client.from('mass_intentions').insert({ ...values, church_id: churchId })
        if (result.error) throw new Error(result.error.message)
        await onSaved()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha de misa" htmlFor="intention-date">
          <Input
            id="intention-date"
            name="massDate"
            type="date"
            required
            value={massDate}
            onChange={(e) => {
              const newDate = e.target.value
              setMassDate(newDate)
              if (selectedScheduleId) {
                const [y, m, d] = newDate.split('-').map(Number)
                const newWd = (y && m && d) ? new Date(y, m - 1, d).getDay() : -1
                const currentSched = schedules.find((s) => s.id === selectedScheduleId)
                const isCancelled = exceptions.some((ex) => ex.massScheduleId === selectedScheduleId && ex.onDate === newDate && ex.action === 'cancelar')
                if (!currentSched || currentSched.weekday !== newWd || isCancelled) {
                  setSelectedScheduleId('')
                }
              }
            }}
          />
        </Field>
        <Field label="Hora" htmlFor="intention-time">
          <Input
            id="intention-time"
            name="massTime"
            type="time"
            value={massTime}
            onChange={(e) => setMassTime(e.target.value)}
          />
        </Field>
        <Field label="Horario registrado" htmlFor="intention-schedule">
          <NativeSelect
            id="intention-schedule"
            name="massScheduleId"
            value={selectedScheduleId}
            onChange={(e) => handleScheduleChange(e.target.value)}
          >
            <option value="">Sin horario asociado</option>
            {availableSchedules.map((schedule) => (
              <option
                key={schedule.id}
                value={schedule.id}
                disabled={schedule.isCancelled}
              >
                {schedule.labelDisplay}{schedule.isCancelled ? ' (Misa cancelada)' : ''}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tipo de intención" htmlFor="intention-type">
          <NativeSelect id="intention-type" name="intentionType" defaultValue={editing?.intentionType ?? 'difunto'}>
            <option value="difunto">Difunto</option>
            <option value="salud">Salud</option>
            <option value="acción de gracias">Acción de gracias</option>
            <option value="intención especial">Intención especial</option>
          </NativeSelect>
        </Field>
      </div>
      {availableSchedules.length === 0 && massDate && (
        <p className="text-xs text-muted-foreground">
          No hay misas recurrentes disponibles para este día ({WEEKDAYS[selectedWeekday] ?? ''}). Puedes ingresar la hora manualmente o seleccionar otra fecha.
        </p>
      )}
      <Field label="Nombre de la intención" htmlFor="intention-honoree">
        <Input id="intention-honoree" name="honoreeName" required defaultValue={editing?.honoreeName ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Solicitante" htmlFor="intention-requested-by">
          <Input id="intention-requested-by" name="requestedBy" defaultValue={editing?.requestedBy ?? ''} />
        </Field>
        <Field label="Teléfono de contacto" htmlFor="intention-phone">
          <Input id="intention-phone" name="contactPhone" type="tel" defaultValue={editing?.contactPhone ?? ''} />
        </Field>
        <Field label="Estipendio (MXN)" htmlFor="intention-stipend">
          <Input id="intention-stipend" name="stipendMxn" type="number" min="0" step="0.01" defaultValue={editing?.stipendMxn ?? 0} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="paid" defaultChecked={editing?.paid ?? false} /> Estipendio pagado
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isMentionedInMass" defaultChecked={editing?.isMentionedInMass ?? true} /> Mencionar en misa
      </label>
      <Field label="Notas" htmlFor="intention-notes">
        <Textarea id="intention-notes" name="notes" rows={3} defaultValue={editing?.notes ?? ''} />
      </Field>
    </FormDialog>
  )
}

async function removeIntention(id: string, churchId: string, setIntentions: (update: (previous: Intention[]) => Intention[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from('mass_intentions').delete().eq('id', id).eq('church_id', churchId)
  if (result.error) throw new Error(result.error.message)
  setIntentions((previous) => previous.filter((intention) => intention.id !== id))
}
