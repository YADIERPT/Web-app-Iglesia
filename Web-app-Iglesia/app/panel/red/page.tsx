import Link from 'next/link'
import { ArrowRight, Church, Users } from 'lucide-react'
import { getChurches, getPublishedContentCount } from '@/lib/data'
import { EmptyState, PageHeader, Panel } from '@/components/panel/panel-ui'
import { NetworkFinanceView } from '@/components/panel/network-finance-view'

export default async function NetworkPanelPage() {
  const [churches, publishedContentCount] = await Promise.all([getChurches(), getPublishedContentCount()])
  return (
    <>
      <PageHeader eyebrow="Super administrador" title="Vista de red" description="Consulta el estado general de las iglesias y entra a cada sede." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-start justify-between"><span className="text-sm text-muted-foreground">Iglesias activas</span><Church className="size-5 text-primary" aria-hidden /></div><p className="mt-4 font-serif text-4xl">{churches.length}</p></div>
        <div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-start justify-between"><span className="text-sm text-muted-foreground">Contenido público</span><Users className="size-5 text-primary" aria-hidden /></div><p className="mt-4 font-serif text-4xl">{publishedContentCount}</p><p className="mt-1 text-xs text-muted-foreground">Registros publicados</p></div>
      </div>
      <Panel title="Iglesias de la red" description="Selecciona una sede para abrir su panel.">
        {churches.length === 0 ? (
          <EmptyState>Aún no hay iglesias disponibles.</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {churches.map((church) => (
              <Link
                key={church.id}
                href={`/panel/${church.slug}`}
                className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <span>
                  <span className="block font-serif text-xl font-semibold">{church.name}</span>
                  <span className="text-sm text-muted-foreground">Abrir panel de la iglesia</span>
                </span>
                <ArrowRight className="size-4 text-primary" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </Panel>
      <NetworkFinanceView />
    </>
  )
}
