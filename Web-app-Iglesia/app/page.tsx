import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Search } from 'lucide-react'
import { PublicShell } from '@/components/site/public-shell'
import { SafeImage } from '@/components/ui/safe-image'
import { getChurches } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Nuestras Iglesias, Nuestra Historia · Mérida, Yucatán',
  description: 'Un archivo digital del patrimonio religioso, histórico y documental de Mérida, Yucatán.',
}

export default async function HomePage() {
  const churches = await getChurches()

  return (
    <PublicShell>
      {/* 1. Hero */}
      <section className="relative flex min-h-[75svh] items-end overflow-hidden bg-sidebar px-6 pb-16 pt-28 text-sidebar-foreground md:px-10 md:pb-24 lg:px-16 lg:pt-36">
        <div className="absolute inset-0 bg-[url('/images/hero-church.png')] bg-cover bg-center opacity-20" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/85 to-sidebar/40" aria-hidden />
        <div className="relative mx-auto w-full max-w-5xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
            Archivo digital · Mérida, Yucatán
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.04] tracking-tight md:text-7xl lg:text-8xl">
            Nuestras Iglesias, Nuestra Historia
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-sidebar-foreground/75 md:text-lg">
            Un archivo digital del patrimonio religioso, histórico y documental de Mérida, Yucatán.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#iglesias"
              className="inline-flex items-center gap-2 rounded-xl bg-sidebar-primary px-6 py-3 text-sm font-medium text-sidebar-primary-foreground shadow-xs transition-transform duration-200 hover:-translate-y-0.5"
            >
              Explorar la red
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>

          <form action="/buscar" className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/70 p-1.5" role="search">
            <Search className="ml-3 size-4 text-sidebar-primary" aria-hidden />
            <input
              name="q"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-sidebar-foreground/50 md:text-base"
              placeholder="Buscar en el archivo y el patrimonio"
              aria-label="Buscar en el archivo y el patrimonio"
            />
            <button className="rounded-lg bg-sidebar-primary px-5 py-2.5 text-xs font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90" type="submit">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* 2. Sección Nuestras {n} Iglesias */}
      <section id="iglesias" className="px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">Catálogo de sedes</p>
          <h2 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-5xl">Nuestras {churches.length} Iglesias</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Explora la historia, los objetos sacros y los santos e imágenes de cada templo.
          </p>

          <div className="mt-12 flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 md:grid md:grid-cols-3 xl:grid-cols-5 md:overflow-visible">
            {churches.map((church) => (
              <Link
                key={church.id}
                href={`/iglesias/${church.slug}`}
                className="group w-[75vw] shrink-0 snap-center overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-xs md:w-auto"
              >
                <SafeImage
                  src={church.coverPath}
                  alt={church.name}
                  fallbackText={church.name}
                  fallbackCategory="church"
                  aspectRatioClass="aspect-[4/3]"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="flex min-h-24 items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-lg font-medium leading-tight group-hover:text-primary transition-colors">{church.name}</h3>
                    {church.patronSaint && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{church.patronSaint}</p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-primary/70 transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
