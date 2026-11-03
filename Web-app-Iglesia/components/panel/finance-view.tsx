'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Coins, Layers, WalletCards } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatTime, monthKey, monthLabel, todayISO } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { AddButton, ExportButtons, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule, StatCard } from './panel-ui'

type Direction = 'ingreso' | 'egreso'

type FinanceEntry = {
  id: string
  entryDate: string
  direction: Direction
  concept: string
  amountMxn: number
  supplier: string
  method: string
  donorName: string
  receiptFolio: string
  notes: string
  massScheduleId: string | null
}

type MassSchedule = {
  id: string
  weekday: number
  time: string
  label: string
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const INCOME_CONCEPTS = [
  ['colecta', 'Colecta'],
  ['donativo', 'Donativo'],
  ['estipendio_misa', 'Estipendio de misa'],
  ['urna', 'Urna'],
  ['servicio', 'Servicio'],
  ['otro_ingreso', 'Otro ingreso'],
] as const

const EXPENSE_CONCEPTS = [
  ['mantenimiento', 'Mantenimiento'],
  ['servicios_basicos', 'Servicios básicos'],
  ['nomina_honorarios', 'Nómina u honorarios'],
  ['insumos_liturgicos', 'Insumos litúrgicos'],
  ['restauracion', 'Restauración'],
  ['apoyo_social', 'Apoyo social'],
  ['otro_egreso', 'Otro egreso'],
] as const

export function FinanceView({ churchId, churchName }: { churchId: string; churchName: string }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [schedules, setSchedules] = useState<MassSchedule[]>([])
  const [pendingUrnBalance, setPendingUrnBalance] = useState<number>(0)
  const [month, setMonth] = useState(monthKey(todayISO()))
  const [directionFilter, setDirectionFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editor = useEditor<FinanceEntry>()

  async function loadData() {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase no está configurado.')

    const [entriesRes, schedulesRes, contractsRes, paymentsRes] = await Promise.all([
      client
        .from('finance_entries')
        .select('id,entry_date,direction,concept,amount_mxn,supplier,method,donor_name,receipt_folio,notes,mass_schedule_id')
        .eq('church_id', churchId)
        .order('entry_date', { ascending: false }),
      client
        .from('mass_schedules')
        .select('id,weekday,time,label')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('weekday')
        .order('time'),
      client.from('urn_contracts').select('id,agreed_price_mxn').eq('church_id', churchId),
      client
        .from('finance_entries')
        .select('amount_mxn,related_id')
        .eq('church_id', churchId)
        .eq('direction', 'ingreso')
        .eq('concept', 'urna')
        .eq('related_type', 'urn_contract')
        .not('related_id', 'is', null),
    ])

    if (entriesRes.error) throw new Error(entriesRes.error.message)
    if (schedulesRes.error) throw new Error(schedulesRes.error.message)

    setEntries(
      (entriesRes.data ?? []).map((row) => ({
        id: row.id,
        entryDate: row.entry_date,
        direction: row.direction,
        concept: row.concept,
        amountMxn: Number(row.amount_mxn),
        supplier: row.supplier ?? '',
        method: row.method ?? '',
        donorName: row.donor_name ?? '',
        receiptFolio: row.receipt_folio ?? '',
        notes: row.notes ?? '',
        massScheduleId: row.mass_schedule_id ?? null,
      })),
    )

    setSchedules(
      (schedulesRes.data ?? []).map((s) => ({
        id: s.id,
        weekday: s.weekday,
        time: String(s.time).slice(0, 5),
        label: s.label,
      })),
    )

    const payments = paymentsRes.data ?? []
    const totalUrnPending = (contractsRes.data ?? []).reduce((sum, contract) => {
      const contractPaid = payments
        .filter((p) => p.related_id === contract.id)
        .reduce((s, p) => s + Number(p.amount_mxn), 0)
      return sum + Math.max(0, Number(contract.agreed_price_mxn) - contractPaid)
    }, 0)

    setPendingUrnBalance(totalUrnPending)
  }

  useEffect(() => {
    void loadData().catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las finanzas.'))
  }, [churchId])

  const months = useMemo(() => [...new Set(entries.map((entry) => monthKey(entry.entryDate)))].sort().reverse(), [entries])
  const monthlyEntries = useMemo(() => entries.filter((entry) => monthKey(entry.entryDate) === month), [entries, month])

  const income = useMemo(
    () => monthlyEntries.filter((entry) => entry.direction === 'ingreso').reduce((total, entry) => total + entry.amountMxn, 0),
    [monthlyEntries],
  )
  const expenses = useMemo(
    () => monthlyEntries.filter((entry) => entry.direction === 'egreso').reduce((total, entry) => total + entry.amountMxn, 0),
    [monthlyEntries],
  )

  const filteredEntries = useMemo(() => {
    if (directionFilter === 'todos') return monthlyEntries
    return monthlyEntries.filter((entry) => entry.direction === directionFilter)
  }, [monthlyEntries, directionFilter])

  // Desglose por concepto en el mes seleccionado
  const conceptBreakdown = useMemo(() => {
    const map = new Map<string, { direction: Direction; total: number; count: number }>()
    for (const e of monthlyEntries) {
      const current = map.get(e.concept) ?? { direction: e.direction, total: 0, count: 0 }
      current.total += e.amountMxn
      current.count += 1
      map.set(e.concept, current)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total)
  }, [monthlyEntries])

  // Desglose de colectas por misa en el mes seleccionado
  const massCollections = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number }>()
    for (const e of monthlyEntries) {
      if (e.concept === 'colecta' && e.massScheduleId) {
        const schedule = schedules.find((s) => s.id === e.massScheduleId)
        const schedLabel = schedule ? `${WEEKDAYS[schedule.weekday]} ${formatTime(schedule.time)} · ${schedule.label}` : 'Misa asignada'
        const current = map.get(e.massScheduleId) ?? { label: schedLabel, total: 0, count: 0 }
        current.total += e.amountMxn
        current.count += 1
        map.set(e.massScheduleId, current)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [monthlyEntries, schedules])

  const exportRows = filteredEntries.map((entry) => {
    const sched = entry.massScheduleId ? schedules.find((s) => s.id === entry.massScheduleId) : null
    const scheduleInfo = sched ? `${WEEKDAYS[sched.weekday]} ${formatTime(sched.time)}` : ''
    return [
      entry.entryDate,
      entry.direction === 'ingreso' ? 'Ingreso' : 'Egreso',
      conceptLabel(entry.concept),
      entry.amountMxn.toFixed(2),
      entry.method,
      scheduleInfo,
      entry.donorName || entry.supplier,
      entry.receiptFolio,
      entry.notes,
    ]
  })

  return (
    <RequireModule module="finanzas">
      <PageHeader
        eyebrow={churchName}
        title="Finanzas"
        description="Registra ingresos, egresos, colectas de misa y consulta el balance de esta iglesia."
        actions={<AddButton onClick={() => { setError(null); editor.create() }}>Nuevo movimiento</AddButton>}
      />

      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos del mes" value={formatCurrency(income)} icon={ArrowUpFromLine} tone="sage" />
        <StatCard label="Egresos del mes" value={formatCurrency(expenses)} icon={ArrowDownToLine} tone="blush" />
        <StatCard label="Balance del mes" value={formatCurrency(income - expenses)} icon={WalletCards} tone="sky" />
        <StatCard label="Saldo pendiente urnas" value={formatCurrency(pendingUrnBalance)} icon={Coins} tone="lavender" />
      </div>

      <Panel
        title="Movimientos contables"
        description="Los estipendios de intenciones pagadas se sincronizan automáticamente."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBreakdown((prev) => !prev)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${showBreakdown ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-accent'}`}
            >
              <Layers className="size-4" aria-hidden />
              {showBreakdown ? 'Ocultar análisis' : 'Ver análisis'}
            </button>

            <NativeSelect value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Mes" className="w-full capitalize sm:w-44">
              {months.length > 0 ? months.map((value) => <option key={value} value={value}>{monthLabel(value)}</option>) : <option value={month}>{monthLabel(month)} · sin registros</option>}
            </NativeSelect>

            <ExportButtons
              filename={`finanzas-${churchId}-${month}`}
              title={`Finanzas · ${churchName}`}
              subtitle={`Movimientos contables de ${monthLabel(month)}`}
              headers={['Fecha', 'Tipo', 'Concepto', 'Monto MXN', 'Método', 'Horario de misa', 'Donante / Proveedor', 'Folio', 'Notas']}
              rows={exportRows}
            />
          </div>
        }
      >
        {/* Desglose analítico condicional */}
        {showBreakdown && (
          <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4 space-y-4">
            <h3 className="font-serif text-lg font-semibold">Desglose analítico de {monthLabel(month)}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ingresos y egresos por concepto</h4>
                {conceptBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin movimientos en este periodo.</p>
                ) : (
                  <div className="space-y-1.5">
                    {conceptBreakdown.map(([c, data]) => (
                      <div key={c} className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                        <span className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${data.direction === 'ingreso' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                          {conceptLabel(c)}
                          <span className="text-xs text-muted-foreground">({data.count})</span>
                        </span>
                        <span className={data.direction === 'ingreso' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-destructive font-medium'}>
                          {data.direction === 'ingreso' ? '+' : '-'}{formatCurrency(data.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Colectas por horario de misa</h4>
                {massCollections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay colectas vinculadas a horarios de misa este mes.</p>
                ) : (
                  <div className="space-y-1.5">
                    {massCollections.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-border/40">
                        <span>
                          {item.label}
                          <span className="ml-1 text-xs text-muted-foreground">({item.count} colecta{item.count > 1 ? 's' : ''})</span>
                        </span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          +{formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Barra de filtros rápidos */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Filtrar:</span>
          <button
            type="button"
            onClick={() => setDirectionFilter('todos')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${directionFilter === 'todos' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
          >
            Todos ({monthlyEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('ingreso')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${directionFilter === 'ingreso' ? 'bg-emerald-700 text-white' : 'border border-border hover:bg-accent'}`}
          >
            Solo ingresos ({monthlyEntries.filter((e) => e.direction === 'ingreso').length})
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('egreso')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${directionFilter === 'egreso' ? 'bg-destructive text-white' : 'border border-border hover:bg-accent'}`}
          >
            Solo egresos ({monthlyEntries.filter((e) => e.direction === 'egreso').length})
          </button>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState>No hay movimientos financieros para el filtro seleccionado.</EmptyState>
        ) : (
          <div className="divide-y divide-border">
            {filteredEntries.map((entry) => {
              const sched = entry.massScheduleId ? schedules.find((s) => s.id === entry.massScheduleId) : null
              return (
                <article key={entry.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl font-semibold">{conceptLabel(entry.concept)}</h2>
                      {entry.receiptFolio && (
                        <span className="rounded border border-border bg-accent/40 px-2 py-0.5 text-xs font-mono text-muted-foreground">
                          {entry.receiptFolio}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(entry.entryDate)} · {entry.direction === 'ingreso' ? 'Ingreso' : 'Egreso'}
                      {entry.method ? ` · ${entry.method}` : ''}
                      {sched ? ` · Misa: ${WEEKDAYS[sched.weekday]} ${formatTime(sched.time)}` : ''}
                    </p>
                    {(entry.donorName || entry.supplier) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.direction === 'ingreso' ? 'Donante: ' : 'Proveedor/Beneficiario: '}
                        {entry.donorName || entry.supplier}
                      </p>
                    )}
                    {entry.notes && <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className={entry.direction === 'ingreso' ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>
                      {entry.direction === 'ingreso' ? '+' : '-'}{formatCurrency(entry.amountMxn)}
                    </strong>
                    <RowActions
                      label={conceptLabel(entry.concept)}
                      onEdit={() => editor.edit(entry)}
                      onDelete={() => removeEntry(entry.id, churchId, setEntries)}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Panel>

      <FinanceFormModal
        key={editor.editing?.id ?? (editor.open ? 'open' : 'closed')}
        open={editor.open}
        onOpenChange={editor.setOpen}
        editing={editor.editing}
        churchId={churchId}
        schedules={schedules}
        onSaved={loadData}
      />
    </RequireModule>
  )
}

function FinanceFormModal({
  open,
  onOpenChange,
  editing,
  churchId,
  schedules,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: FinanceEntry | null
  churchId: string
  schedules: MassSchedule[]
  onSaved: () => Promise<void>
}) {
  const [direction, setDirection] = useState<Direction>(editing?.direction ?? 'ingreso')
  const [concept, setConcept] = useState<string>(editing?.concept ?? (editing?.direction === 'egreso' ? 'mantenimiento' : 'colecta'))

  useEffect(() => {
    if (editing) {
      setDirection(editing.direction)
      setConcept(editing.concept)
    } else {
      setDirection('ingreso')
      setConcept('colecta')
    }
  }, [editing, open])

  function handleDirectionChange(newDirection: Direction) {
    setDirection(newDirection)
    if (newDirection === 'ingreso') {
      setConcept('colecta')
    } else {
      setConcept('mantenimiento')
    }
  }

  const activeConceptOptions = direction === 'ingreso' ? INCOME_CONCEPTS : EXPENSE_CONCEPTS

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar movimiento contable' : 'Nuevo movimiento contable'}
      description="El movimiento quedará registrado en los libros de esta iglesia."
      onSubmit={async (form) => {
        const client = getSupabaseClient()
        if (!client) throw new Error('Supabase no está configurado.')

        const validConcepts = direction === 'ingreso' ? INCOME_CONCEPTS : EXPENSE_CONCEPTS
        if (!validConcepts.some(([value]) => value === concept)) {
          throw new Error('El concepto no corresponde al tipo de movimiento seleccionado.')
        }

        const massScheduleId = form.get('massScheduleId') ? String(form.get('massScheduleId')) : null

        const values = {
          entry_date: String(form.get('entryDate') ?? ''),
          direction,
          concept,
          amount_mxn: Math.max(0, Number(form.get('amountMxn') ?? 0)),
          supplier: direction === 'egreso' ? (String(form.get('party') ?? '').trim() || null) : null,
          donor_name: direction === 'ingreso' ? (String(form.get('party') ?? '').trim() || null) : null,
          method: String(form.get('method') ?? '').trim() || null,
          receipt_folio: String(form.get('receiptFolio') ?? '').trim() || null,
          mass_schedule_id: concept === 'colecta' ? massScheduleId : null,
          notes: String(form.get('notes') ?? '').trim() || null,
        }

        const result = editing
          ? await client.from('finance_entries').update(values).eq('id', editing.id).eq('church_id', churchId)
          : await client.from('finance_entries').insert({ ...values, church_id: churchId })

        if (result.error) throw new Error(result.error.message)
        await onSaved()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de movimiento" htmlFor="finance-direction">
          <NativeSelect
            id="finance-direction"
            name="direction"
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value as Direction)}
          >
            <option value="ingreso">Ingreso (+)</option>
            <option value="egreso">Egreso (-)</option>
          </NativeSelect>
        </Field>

        <Field label="Concepto" htmlFor="finance-concept">
          <NativeSelect
            id="finance-concept"
            name="concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          >
            {activeConceptOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Fecha" htmlFor="finance-date">
          <Input id="finance-date" name="entryDate" type="date" required defaultValue={editing?.entryDate ?? todayISO()} />
        </Field>

        <Field label="Monto (MXN)" htmlFor="finance-amount">
          <Input id="finance-amount" name="amountMxn" type="number" min="0.01" step="0.01" required defaultValue={editing?.amountMxn ?? ''} />
        </Field>

        <Field label="Método de pago" htmlFor="finance-method">
          <Input id="finance-method" name="method" placeholder="Efectivo, transferencia, cheque..." defaultValue={editing?.method ?? ''} />
        </Field>

        <Field label="Folio de recibo" htmlFor="finance-folio">
          <Input
            id="finance-folio"
            name="receiptFolio"
            placeholder="Automático (REC-XXXXXX)"
            defaultValue={editing?.receiptFolio ?? ''}
          />
        </Field>
      </div>

      {/* Selector de horario si el concepto es colecta */}
      {concept === 'colecta' && (
        <Field label="Horario de misa asociado (opcional)" htmlFor="finance-schedule">
          <NativeSelect id="finance-schedule" name="massScheduleId" defaultValue={editing?.massScheduleId ?? ''}>
            <option value="">Sin horario específico</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {WEEKDAYS[s.weekday]} {formatTime(s.time)} · {s.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <Field
        label={direction === 'ingreso' ? 'Donante / Benefactor (opcional)' : 'Proveedor / Destinatario (opcional)'}
        htmlFor="finance-party"
      >
        <Input
          id="finance-party"
          name="party"
          placeholder={direction === 'ingreso' ? 'Nombre del donante' : 'Nombre de la empresa o persona'}
          defaultValue={direction === 'ingreso' ? (editing?.donorName ?? '') : (editing?.supplier ?? '')}
        />
      </Field>

      <Field label="Notas o comentarios adicionales" htmlFor="finance-notes">
        <Textarea id="finance-notes" name="notes" rows={2} defaultValue={editing?.notes ?? ''} />
      </Field>
    </FormDialog>
  )
}

function conceptLabel(concept: string) {
  return [...INCOME_CONCEPTS, ...EXPENSE_CONCEPTS].find(([value]) => value === concept)?.[1] ?? concept
}

async function removeEntry(id: string, churchId: string, setEntries: (update: (previous: FinanceEntry[]) => FinanceEntry[]) => void) {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado.')
  const result = await client.from('finance_entries').delete().eq('id', id).eq('church_id', churchId)
  if (result.error) throw new Error(result.error.message)
  setEntries((previous) => previous.filter((entry) => entry.id !== id))
}
