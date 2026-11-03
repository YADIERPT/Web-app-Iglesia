'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { CalendarRange, HandCoins, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, monthKey, monthLabel, startOfWeekISO, todayISO } from '@/lib/format'
import { newId, useChurch } from '@/lib/store'
import { DONATION_CONCEPTS, DONATION_METHODS, type Donation } from '@/lib/types'
import { AddButton, ExportButtons, Field, FormDialog, NativeSelect, RowActions, useEditor } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule, StatCard } from './panel-ui'

const chartConfig = { total: { label: 'Total', color: 'var(--chart-1)' } } satisfies ChartConfig

export function DonationsView() {
  const { donations, members, save, remove } = useChurch()
  const editor = useEditor<Donation>()
  const [month, setMonth] = useState(monthKey(todayISO()))
  const today = todayISO()
  const week = startOfWeekISO(today)

  const sum = (list: Donation[]) => list.reduce((s, d) => s + d.amount, 0)
  const weekTotal = sum(donations.filter((d) => d.date >= week && d.date <= today))
  const monthTotal = sum(donations.filter((d) => monthKey(d.date) === monthKey(today)))
  const yearTotal = sum(donations.filter((d) => d.date.startsWith(today.slice(0, 4))))

  const months = [...new Set(donations.map((d) => monthKey(d.date)))].sort().reverse()
  const filtered = donations.filter((d) => monthKey(d.date) === month).sort((a, b) => b.date.localeCompare(a.date))
  const byConcept = DONATION_CONCEPTS.map((concept) => ({ concepto: concept, total: sum(filtered.filter((d) => d.concept === concept)) }))
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? 'Anónimo'

  const headers = ['Fecha', 'Concepto', 'Método', 'Donante', 'Monto']
  const rows = filtered.map((d) => [formatDate(d.date), d.concept, d.method, memberName(d.memberId), d.amount])

  return (
    <RequireModule module="donaciones">
      <PageHeader
        eyebrow="Finanzas"
        title="Aportaciones"
        description="Registro de diezmos, ofrendas y donaciones."
        actions={
          <>
            <ExportButtons filename={`aportaciones-${month}`} title="Reporte de aportaciones" subtitle={monthLabel(month)} headers={headers} rows={rows} />
            <AddButton onClick={editor.create}>Registrar</AddButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Esta semana" value={formatCurrency(weekTotal)} icon={HandCoins} tone="sage" />
        <StatCard label="Este mes" value={formatCurrency(monthTotal)} icon={CalendarRange} tone="sky" delay={80} />
        <StatCard label="Este año" value={formatCurrency(yearTotal)} icon={TrendingUp} tone="blush" delay={160} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Panel
          title="Movimientos"
          className="xl:col-span-3"
          actions={
            <NativeSelect value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes" className="w-full capitalize sm:w-44">
              {months.length > 0 ? months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              )) : <option value={month}>{monthLabel(month)} · sin movimientos</option>}
            </NativeSelect>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState>Sin movimientos este mes.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="hidden md:table-cell">Donante</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{formatDate(d.date, { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell>
                      <p className="font-medium">{d.concept}</p>
                      <p className="text-xs text-muted-foreground">{d.method}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{memberName(d.memberId)}</TableCell>
                    <TableCell className="text-right font-serif text-lg">{formatCurrency(d.amount)}</TableCell>
                    <TableCell>
                      <RowActions label={`${d.concept} ${formatCurrency(d.amount)}`} onEdit={() => editor.edit(d)} onDelete={() => remove('donations', d.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="Por concepto" description={monthLabel(month)} className="xl:col-span-2">
          {filtered.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={byConcept}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="concepto" tickLine={false} axisLine={false} tickMargin={10} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState>No hay aportaciones que resumir en este mes.</EmptyState>
          )}
        </Panel>
      </div>

      <FormDialog
        key={editor.editing?.id ?? 'new'}
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.editing ? 'Editar aportación' : 'Registrar aportación'}
        onSubmit={async (form) => {
          const memberId = String(form.get('memberId'))
          await save('donations', {
            id: editor.editing?.id ?? newId(),
            date: String(form.get('date')),
            amount: Math.max(0, Number(form.get('amount'))),
            concept: form.get('concept') as Donation['concept'],
            method: form.get('method') as Donation['method'],
            memberId: memberId || null,
          })
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha" htmlFor="d-date">
            <Input id="d-date" name="date" type="date" required defaultValue={editor.editing?.date ?? today} />
          </Field>
          <Field label="Monto (MXN)" htmlFor="d-amount">
            <Input id="d-amount" name="amount" type="number" min="1" step="0.01" required defaultValue={editor.editing?.amount} />
          </Field>
          <Field label="Concepto" htmlFor="d-concept">
            <NativeSelect id="d-concept" name="concept" defaultValue={editor.editing?.concept ?? 'Diezmo'}>
              {DONATION_CONCEPTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Método" htmlFor="d-method">
            <NativeSelect id="d-method" name="method" defaultValue={editor.editing?.method ?? 'Efectivo'}>
              {DONATION_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Donante" htmlFor="d-member">
          <NativeSelect id="d-member" name="memberId" defaultValue={editor.editing?.memberId ?? ''}>
            <option value="">Anónimo</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </FormDialog>
    </RequireModule>
  )
}
