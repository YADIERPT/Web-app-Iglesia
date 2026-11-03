import { notFound } from 'next/navigation'
import { UsersManagementView } from '@/components/panel/users-management-view'
import { ScheduleView } from '@/components/panel/schedule-view'
import { getMassSchedules, getScheduleExceptions } from '@/lib/data'
import { ContentListView } from '@/components/panel/content-list-view'
import { DocumentsView } from '@/components/panel/documents-view'
import { HistoryView } from '@/components/panel/history-view'
import { ChurchEventsView } from '@/components/panel/church-events-view'
import { MassIntentionsView } from '@/components/panel/mass-intentions-view'
import { FinanceView } from '@/components/panel/finance-view'
import { UrnsView } from '@/components/panel/urns-view'
import { ServicePricesView } from '@/components/panel/service-prices-view'
import { AnnouncementsView } from '@/components/panel/announcements-view'
import { SettingsView } from '@/components/panel/settings-view'
import { getChurchBySlug } from '@/lib/data'

const MODULES = [
  'archivo',
  'patrimonio',
  'santos',
  'historia',
  'horarios',
  'calendario',
  'intenciones',
  'finanzas',
  'urnas',
  'tarifario',
  'usuarios',
  'comunicados',
  'configuracion',
]

export default async function PanelModulePage({ params }: { params: Promise<{ slug: string; module: string }> }) {
  const { slug, module } = await params
  const church = await getChurchBySlug(slug)
  if (!church || !MODULES.includes(module)) notFound()
  if (module === 'usuarios') return <UsersManagementView churchId={church.id} churchName={church.name} />
  if (module === 'horarios') {
    const [schedules, exceptions] = await Promise.all([getMassSchedules(church.id), getScheduleExceptions(church.id)])
    return (
      <ScheduleView
        churchName={church.name}
        churchId={church.id}
        schedules={schedules}
        exceptions={exceptions.map((exception) => ({
          id: exception.id,
          scheduleId: exception.massScheduleId,
          date: exception.onDate,
          action: exception.action,
          newTime: exception.newTime ?? undefined,
          note: exception.note,
        }))}
      />
    )
  }
  if (module === 'patrimonio' || module === 'santos') {
    return <ContentListView module={module} churchId={church.id} churchName={church.name} />
  }
  if (module === 'archivo') return <DocumentsView churchId={church.id} churchName={church.name} />
  if (module === 'historia') {
    return (
      <HistoryView
        churchId={church.id}
        churchName={church.name}
        initialSummary={church.historySummary}
        initialHistory={church.historyFull}
        initialFoundedYear={church.foundedYear}
      />
    )
  }
  if (module === 'calendario') return <ChurchEventsView churchId={church.id} churchName={church.name} />
  if (module === 'intenciones') return <MassIntentionsView churchId={church.id} churchName={church.name} />
  if (module === 'finanzas') return <FinanceView churchId={church.id} churchName={church.name} />
  if (module === 'urnas') return <UrnsView churchId={church.id} churchName={church.name} />
  if (module === 'tarifario') return <ServicePricesView churchId={church.id} churchName={church.name} />
  if (module === 'comunicados') return <AnnouncementsView />
  if (module === 'configuracion') return <SettingsView />
  notFound()
}
