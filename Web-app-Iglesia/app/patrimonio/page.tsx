import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { ChurchFilterSelect } from '@/components/site/church-filter-select'
import { SafeImage } from '@/components/ui/safe-image'
import { getChurches, getHeritageObjects, getSaints } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Patrimonio y Santos · Archivo Iglesias de Mérida',
  description: 'Catálogo público del patrimonio sacro, objetos históricos y santos e imágenes de las iglesias de Mérida, Yucatán.',
}

export default async function PatrimonioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; iglesia?: string }>
}) {
  const { categoria, iglesia } = await searchParams
  const [churches, objects, saints] = await Promise.all([
    getChurches(),
    getHeritageObjects(),
    getSaints(),
  ])

  const activeCategory = categoria === 'santos' ? 'santos' : categoria === 'objetos' ? 'objetos' : 'todos'

  const selectedChurch = churches.find((c) => c.id === iglesia || c.slug === iglesia)
  const selectedChurchId = selectedChurch?.id ?? iglesia

  const filteredObjects = objects.filter((o) => !iglesia || o.churchId === selectedChurchId)
  const filteredSaints = saints.filter((s) => !iglesia || s.churchId === selectedChurchId)

  const churchMap = new Map(churches.map((c) => [c.id, c]))
  const churchParam = iglesia ? `&iglesia=${encodeURIComponent(iglesia)}` : ''

  return (
    <PublicShell>
      <PageIntro
        title="Patrimonio sacro e iconografía"
        description="Bienes históricos, cálices, custodias y representaciones devocionales de las iglesias de Mérida."
      />

      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* Barra de filtros y pestañas */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={iglesia ? `/patrimonio?iglesia=${encodeURIComponent(iglesia)}` : '/patrimonio'}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === 'todos'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-accent'
                }`}
              >
                Todo el acervo ({filteredObjects.length + filteredSaints.length})
              </Link>
              <Link
                href={`/patrimonio?categoria=objetos${churchParam}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === 'objetos'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-accent'
                }`}
              >
                Objetos históricos ({filteredObjects.length})
              </Link>
              <Link
                href={`/patrimonio?categoria=santos${churchParam}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === 'santos'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-accent'
                }`}
              >
                Santos e imágenes ({filteredSaints.length})
              </Link>
            </div>

            {/* Selector interactivo de iglesia (Client Component) */}
            <ChurchFilterSelect
              churches={churches.map((c) => ({ id: c.id, name: c.name }))}
              selectedChurch={selectedChurch?.id ?? iglesia}
              category={activeCategory}
            />
          </div>

          {/* Categoría: Objetos históricos */}
          {(activeCategory === 'todos' || activeCategory === 'objetos') && (
            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-3xl font-semibold">Objetos históricos y de valor</h2>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {filteredObjects.length} bienes catalogados
                </span>
              </div>

              {filteredObjects.length === 0 ? (
                <EmptyState>No hay objetos históricos publicados para esta selección.</EmptyState>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredObjects.map((item) => {
                    const church = churchMap.get(item.churchId)
                    return (
                      <Link
                        key={item.id}
                        href={`/iglesias/${church?.slug}/patrimonio/${item.id}`}
                        className="group overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs"
                      >
                        <SafeImage
                          src={item.coverPath}
                          alt={item.name}
                          fallbackText={item.name}
                          fallbackCategory="patrimonio"
                          aspectRatioClass="aspect-[4/3]"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs text-gold-text uppercase tracking-wider">
                            <span>{item.category || 'Objeto sacro'}</span>
                            {item.quantity > 1 && <span>Cant: {item.quantity}</span>}
                          </div>
                          <h3 className="mt-2 font-serif text-xl font-medium leading-tight group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {item.description || church?.name}
                          </p>
                          <p className="mt-3 text-xs font-medium text-foreground/80">
                            {church?.name}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Categoría: Santos e imágenes */}
          {(activeCategory === 'todos' || activeCategory === 'santos') && (
            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-3xl font-semibold">Santos e imágenes religiosas</h2>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {filteredSaints.length} advocaciones catalogadas
                </span>
              </div>

              {filteredSaints.length === 0 ? (
                <EmptyState>No hay santos o imágenes devocionales publicados para esta selección.</EmptyState>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSaints.map((item) => {
                    const church = churchMap.get(item.churchId)
                    return (
                      <Link
                        key={item.id}
                        href={`/iglesias/${church?.slug}/santos/${item.id}`}
                        className="group overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs"
                      >
                        <SafeImage
                          src={item.coverPath}
                          alt={item.name}
                          fallbackText={item.name}
                          fallbackCategory="santo"
                          aspectRatioClass="aspect-[4/3]"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs text-gold-text uppercase tracking-wider">
                            <span>{item.kind || 'Imagen devocional'}</span>
                            {item.feastDayMonth && item.feastDayDay && (
                              <span>Fiesta: {item.feastDayDay}/{item.feastDayMonth}</span>
                            )}
                          </div>
                          <h3 className="mt-2 font-serif text-xl font-medium leading-tight group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          {item.invocation && (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              {item.invocation}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {item.description || item.history}
                          </p>
                          <p className="mt-3 text-xs font-medium text-foreground/80">
                            {church?.name}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  )
}
