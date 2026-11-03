import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Search } from 'lucide-react'
import { Monogram, PublicShell } from '@/components/site/public-shell'
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
      <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-sidebar px-6 pb-16 pt-32 text-sidebar-foreground md:px-10 md:pb-24 lg:px-16">
        <div className="absolute inset-0 bg-[url('/images/hero-church.png')] bg-cover bg-center opacity-25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/80 to-sidebar/30" aria-hidden />
        <div className="relative mx-auto w-full max-w-5xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-sidebar-primary">
            Archivo digital · Mérida, Yucatán
          </p>
          <h1 className="max-w-4xl font-serif text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">
            Nuestras Iglesias, Nuestra Historia
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-sidebar-foreground/75">
            Un archivo digital del patrimonio religioso de Mérida, Yucatán.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#iglesias"
              className="inline-flex items-center gap-2 rounded-xl bg-sidebar-primary px-6 py-3.5 text-sm font-semibold text-sidebar-primary-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              Explorar la red
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>

          <form action="/buscar" className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/80 p-2" role="search">
            <Search className="ml-3 size-5 text-sidebar-primary" aria-hidden />
            <input
              name="q"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base outline-none placeholder:text-sidebar-foreground/50"
              placeholder="Buscar en el archivo y el patrimonio"
              aria-label="Buscar en el archivo y el patrimonio"
            />
            <button className="rounded-lg bg-sidebar-primary px-5 py-3 text-sm font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90" type="submit">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* 2. Sección Nuestras {n} Iglesias */}
      <section id="iglesias" className="px-6 py-20 md:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-4xl font-semibold md:text-6xl">Nuestras {churches.length} Iglesias</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Explora la historia, los objetos sacros y los santos e imágenes de cada templo.
          </p>

          <div className="mt-12 flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 md:grid md:grid-cols-3 xl:grid-cols-5 md:overflow-visible">
            {churches.map((church) => (
              <Link
                key={church.id}
                href={`/iglesias/${church.slug}`}
                className="group w-[75vw] shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary md:w-auto"
              >
                {church.coverPath ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                    <img
                      src={church.coverPath}
                      alt={church.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <Monogram name={church.name} />
                )}
                <div className="flex min-h-28 items-center justify-between gap-3 p-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold leading-tight">{church.name}</h3>
                    {church.patronSaint && (
                      <p className="mt-1 text-xs text-muted-foreground">{church.patronSaint}</p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
