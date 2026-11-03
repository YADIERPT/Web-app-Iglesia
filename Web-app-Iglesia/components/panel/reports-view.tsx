'use client'

import { useState } from 'react'
import { Line, LineChart, CartesianGrid, XAxis } from 'recharts'
import { CalendarDays, ClipboardCheck, HandCoins, Users } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { canSeeFinance } from '@/lib/permissions'
import { useChurch } from '@/lib/store'
import { formatCurrency, formatDate, monthKey, monthLabel, todayISO } from '@/lib/format'
import { ExportButtons, NativeSelect } from './form-kit'
import { EmptyState, PageHeader, Panel, RequireModule, StatCard } from './panel-ui'

const chartConfig = {
  asistencia: { label: 'Asistencia promedio', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function ReportsView() {
  const { currentUser, members, events, attendance, donations } = useChurch()
  const showFinance = canSeeFinance(currentUser?.role)
  const financeOnly = currentUser?.role === 'tesorero'
  const reportDates = financeOnly
    ? donations.map((donation) => donation.date)
    : [
        ...attendance.map((record) => record.date),
        ...donations.map((donation) => donation.date),
        ...events.map((event) => event.date),
        ...members.map((member) => member.joinDate),
      ]
  const allMonths = [...new Set(reportDates.map(monthKey))].sort().reverse()
  const [selectedMonth, setSelectedMonth] = useState(() => allMonths.find((m) => m <= monthKey(todayISO())) ?? allMonths[0] ?? monthKey(todayISO()))
  const month = allMonths.includes(selectedMonth) ? selectedMonth : allMonths[0] ?? monthKey(todayISO())

  const monthAttendance = attendance.filter((a) => monthKey(a.date) === month)
  const avgAttendance = monthAttendance.length ? Math.round(monthAttendance.reduce((s, a) => s + a.presentIds.length, 0) / monthAttendance.length) : 0
  const monthEvents = events.filter((e) => monthKey(e.date) === month).sort((a, b) => a.date.localeCompare(b.date))
  const monthDonations = donations.filter((d) => monthKey(d.date) === month)
  const newMembers = members.filter((m) => monthKey(m.joinDate) === month).length

  const trend = [...allMonths]
    .reverse()
    .slice(-6)
    .map((m) => {
      const recs = attendance.filter((a) => monthKey(a.date) === m)
      return { mes: monthLabel(m, 'short'), asistencia: recs.length ? Math.round(recs.reduce((s, a) => s + a.presentIds.length, 0) / recs.length) : 0 }
    })

  const headers = ['Indicador', 'Valor']
  const rows: (string | number)[][] = [
    ...(financeOnly ? [] : [
      ['Miembros activos', members.filter((m) => m.active).length],
      ['Nuevos miembros', newMembers],
      ['Eventos del mes', monthEvents.length],
      ['Reuniones registradas', monthAttendance.length],
      ['Asistencia promedio', avgAttendance],
    ]),
    ...(showFinance ? [['Total aportaciones', formatCurrency(monthDonations.reduce((s, d) => s + d.amount, 0))]] : []),
    ...(!financeOnly ? monthEvents.map((e) => [`Evento: ${e.title}`, formatDate(e.date)]) : []),
  ]

  return (
    <RequireModule module="reportes">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description={financeOnly ? 'Resumen mensual de aportaciones.' : 'Resumen mensual de la actividad de la iglesia.'}
        actions={
          <>
            <NativeSelect value={month} onChange={(e) => setSelectedMonth(e.target.value)} aria-label="Mes del reporte" className="w-full rounded-full sm:w-44">
              {allMonths.length > 0 ? allMonths.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              )) : <option value={month}>{monthLabel(month)} · sin registros</option>}
            </NativeSelect>
            <ExportButtons filename={`reporte-${month}`} title="Reporte mensual" subtitle={monthLabel(month)} headers={headers} rows={rows} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!financeOnly && (
          <>
            <StatCard label="Nuevos miembros" value={newMembers} icon={Users} tone="lavender" />
            <StatCard label="Eventos" value={monthEvents.length} icon={CalendarDays} tone="sky" delay={80} />
            <StatCard label="Asistencia promedio" value={avgAttendance} hint={`${monthAttendance.length} reuniones`} icon={ClipboardCheck} tone="sage" delay={160} />
          </>
        )}
        {showFinance && (
          <StatCard label="Aportaciones" value={formatCurrency(monthDonations.reduce((s, d) => s + d.amount, 0))} hint={`${monthDonations.length} movimientos`} icon={HandCoins} tone="blush" delay={financeOnly ? 0 : 240} />
        )}
      </div>

      {!financeOnly && <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Tendencia de asistencia" description="Promedio por mes" className="xl:col-span-2">
          {trend.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <LineChart data={trend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={10} className="capitalize" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="asistencia" type="monotone" stroke="var(--color-asistencia)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-asistencia)' }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyState>Aún no hay datos para generar la tendencia.</EmptyState>
          )}
        </Panel>
        <Panel title="Eventos del mes">
          <ul className="flex flex-col divide-y divide-border">
            {monthEvents.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Sin eventos.</li>}
            {monthEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate text-sm font-medium">{e.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.date, { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>}
    </RequireModule>
  )
}
