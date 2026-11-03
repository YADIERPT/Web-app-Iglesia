'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, FileText, Landmark } from 'lucide-react'
import { formatDate, formatTime, todayISO } from '@/lib/format'
import { getSupabaseClient } from '@/lib/supabase'
import { EmptyState, PageHeader, Panel, StatCard } from './panel-ui'

type UpcomingEvent = { id: string; title: string; date: string; time: string; place: string }

export function ChurchDashboardView({ churchId, churchName, churchSlug }: { churchId: string; churchName: string; churchSlug: string }) {
  const [stats, setStats] = useState({ published: 0, schedules: 0, services: 0, events: 0 })
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase no está configurado.')
      return
    }
    void Promise.all([
      client.from('heritage_objects').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('visibility', 'publico').eq('status', 'publicado'),
      client.from('saints').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('visibility', 'publico').eq('status', 'publicado'),
      client.from('documents').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('visibility', 'publico').eq('status', 'publicado'),
      client.from('mass_schedules').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('is_active', true),
      client.from('service_prices').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('show_publicly', true).eq('is_active', true),
      client.from('events').select('id,title,date,time,place').eq('church_id', churchId).eq('status', 'programado').gte('date', todayISO()).order('date').order('time').limit(5),
    ]).then(([heritage, saints, documents, schedules, services, upcoming]) => {
      const results = [heritage, saints, documents, schedules, services, upcoming]
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        setError(failed.error.message)
        return
      }
      setStats({
        published: (heritage.count ?? 0) + (saints.count ?? 0) + (documents.count ?? 0),
        schedules: schedules.count ?? 0,
        services: services.count ?? 0,
        events: upcoming.data?.length ?? 0,
      })
      setEvents((upcoming.data ?? []) as UpcomingEvent[])
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el dashboard.'))
  }, [churchId])

  return (
    <>
      <PageHeader eyebrow={churchName} title="Resumen de la iglesia" description="Consulta rápidamente el estado del contenido y la agenda de esta sede." />
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contenido público" value={stats.published} icon={Landmark} tone="lavender" />
        <StatCard label="Horarios activos" value={stats.schedules} icon={Clock3} tone="sage" />
        <StatCard label="Servicios públicos" value={stats.services} icon={FileText} tone="sky" />
        <StatCard label="Próximos eventos" value={stats.events} icon={CalendarDays} tone="blush" />
      </div>
      <Panel
        title="Próximos eventos"
        actions={<Link href={`/panel/${churchSlug}/calendario`} className="flex items-center gap-1 text-sm text-primary hover:underline">Ver calendario <ArrowRight className="size-3.5" aria-hidden /></Link>}
        className="mt-6"
      >
        {events.length === 0 ? <EmptyState>No hay eventos programados próximamente.</EmptyState> : (
          <div className="divide-y divide-border">
            {events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"><div><h2 className="font-serif text-xl font-semibold">{event.title}</h2><p className="mt-1 text-sm text-muted-foreground">{formatDate(event.date)} · {event.place}</p></div><span className="text-sm text-gold-text">{formatTime(event.time)}</span></div>)}
          </div>
        )}
      </Panel>
    </>
  )
}
