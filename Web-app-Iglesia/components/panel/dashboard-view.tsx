'use client'

import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ArrowUpRight, CalendarDays, ClipboardCheck, HandCoins, Megaphone, Users } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { canSeeFinance, ROLE_LABELS } from '@/lib/permissions'
import { useChurch } from '@/lib/store'
import { formatCurrency, formatDate, formatTime, monthKey, monthLabel, parseISODate, todayISO } from '@/lib/format'
import { EmptyState, PageHeader, Panel, StatCard } from './panel-ui'

const chartConfig = {
  asistentes: { label: 'Asistentes', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function DashboardView() {
  const { currentUser, publicMemberCount, events, attendance, donations, announcements } = useChurch()
  const today = todayISO()
  const thisMonth = monthKey(today)
  const showFinance = canSeeFinance(currentUser?.role)

  const upcoming = events.filter((e) => e.date >= today && e.status === 'programado').sort((a, b) => a.date.localeCompare(b.date))
  const sortedAttendance = [...attendance].sort((a, b) => a.date.localeCompare(b.date))
  const lastAttendance = sortedAttendance.at(-1)
  const monthDonations = donations.filter((d) => monthKey(d.date) === thisMonth).reduce((sum, d) => sum + d.amount, 0)

  const chartData = sortedAttendance.slice(-8).map((record) => ({
    fecha: formatDate(record.date, { day: 'numeric', month: 'short' }),
    asistentes: record.presentIds.length,
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[currentUser?.role ?? 'coordinador']}
        title={`${greeting}, ${currentUser?.name.split(' ')[0]}`}
        description="Este es el resumen de la vida de la iglesia esta semana."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Miembros activos" value={publicMemberCount} icon={Users} tone="lavender" />
        <StatCard label="Próximos eventos" value={upcoming.length} hint={upcoming[0] ? `Siguiente: ${upcoming[0].title}` : 'Sin eventos'} icon={CalendarDays} tone="sky" delay={80} />
        <StatCard
          label="Asistencia reciente"
          value={lastAttendance?.presentIds.length ?? 0}
          hint={lastAttendance ? formatDate(lastAttendance.date) : 'Sin registros'}
          icon={ClipboardCheck}
          tone="sage"
          delay={160}
        />
        {showFinance ? (
          <StatCard label="Aportaciones del mes" value={formatCurrency(monthDonations)} hint={monthLabel(thisMonth)} icon={HandCoins} tone="blush" delay={240} />
        ) : (
          <StatCard label="Comunicados" value={announcements.length} hint="Publicados" icon={Megaphone} tone="blush" delay={240} />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {currentUser?.role !== 'tesorero' && (
          <Panel title="Asistencia" description="Últimas reuniones registradas" className="xl:col-span-2">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <AreaChart data={chartData} margin={{ left: 4, right: 4 }}>
                  <defs>
                    <linearGradient id="fillAsistentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-asistentes)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-asistentes)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="asistentes" type="monotone" stroke="var(--color-asistentes)" strokeWidth={2.5} fill="url(#fillAsistentes)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState>Aún no hay registros de asistencia para mostrar.</EmptyState>
            )}
          </Panel>
        )}

        <Panel
          title="Agenda"
          className={currentUser?.role === 'tesorero' ? 'xl:col-span-3' : undefined}
          actions={
            <Link href="/panel/eventos" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Ver todo <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          {upcoming.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {upcoming.slice(0, 5).map((event) => {
                const date = parseISODate(event.date)
                return (
                  <li key={event.id} className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <span className="font-serif text-lg leading-none">{date.getDate()}</span>
                      <span className="text-[10px] uppercase">{new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.time)} · {event.place}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState>No hay próximos eventos programados.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  )
}
