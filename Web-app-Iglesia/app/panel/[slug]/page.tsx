import { notFound, redirect } from 'next/navigation'
import { getChurchBySlug, getChurches } from '@/lib/data'
import { ChurchDashboardView } from '@/components/panel/church-dashboard-view'

const PANEL_MODULES = [
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

export default async function ChurchPanelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (PANEL_MODULES.includes(slug)) {
    const churches = await getChurches()
    const targetSlug = churches[0]?.slug ?? 'catedral-san-ildefonso'
    redirect(`/panel/${targetSlug}/${slug}`)
  }

  const church = await getChurchBySlug(slug)
  if (!church) notFound()
  return <ChurchDashboardView churchId={church.id} churchName={church.name} churchSlug={church.slug} />
}
