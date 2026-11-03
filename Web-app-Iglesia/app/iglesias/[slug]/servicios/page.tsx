import { notFound } from 'next/navigation'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { getChurchBySlug, getServicePrices } from '@/lib/data'
import { formatCurrency } from '@/lib/format'

export default async function ChurchServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const church = await getChurchBySlug(slug)
  if (!church) notFound()
  const services = await getServicePrices(church.id)
  return (
    <PublicShell>
      <PageIntro title={`Servicios · ${church.name}`} description="Cuotas sugeridas y servicios publicados por la iglesia." />
      <section className="px-6 py-12 md:px-10 lg:px-16"><div className="mx-auto max-w-3xl">
        {services.length === 0 ? <EmptyState>Aún no hay servicios publicados.</EmptyState> : <div className="space-y-4">{services.map((service) => <article key={service.id} className="rounded-xl border border-border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-2xl font-semibold">{service.name}</h2><p className="mt-2 text-sm text-muted-foreground">{service.description}</p></div><p className="font-semibold text-gold-text">{service.donationSuggested ? 'Cuota sugerida' : 'Precio'} · {formatCurrency(service.suggestedPrice)}</p></div></article>)}</div>}
      </div></section>
    </PublicShell>
  )
}
