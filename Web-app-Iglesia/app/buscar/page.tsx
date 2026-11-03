import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { EmptyState, PageIntro, PublicShell } from '@/components/site/public-shell'
import { searchPublicContent } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Búsqueda pública · Archivo Iglesias de Mérida',
  description: 'Búsqueda global en el archivo documental, patrimonio sacro e historia de las iglesias de Mérida, Yucatán.',
}

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const results = q ? await searchPublicContent(q) : []
  return (
    <PublicShell>
      <PageIntro title="Buscar" description={q ? `Resultados para “${q}”.` : 'Busca en la historia, el patrimonio y el archivo público.'} />
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <form className="flex items-center gap-2 rounded-xl border border-border/80 bg-card p-1.5 shadow-xs" role="search">
            <Search className="ml-3 size-4 text-primary" aria-hidden />
            <input
              autoFocus
              name="q"
              defaultValue={q}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground md:text-base"
              placeholder="Escribe una palabra o frase"
            />
            <button className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90">
              Buscar
            </button>
          </form>
          <div className="mt-8">
            {!q ? (
              <EmptyState>Escribe un término para iniciar la búsqueda.</EmptyState>
            ) : results.length === 0 ? (
              <EmptyState>No encontramos resultados públicos para esta búsqueda.</EmptyState>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card shadow-xs">
                {results.map((result) => (
                  <Link
                    key={`${result.category}-${result.id}`}
                    href={result.href}
                    target={result.category === 'Archivo' ? '_blank' : undefined}
                    rel={result.category === 'Archivo' ? 'noopener noreferrer' : undefined}
                    className="block p-5 transition-colors hover:bg-secondary/40"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-text">
                      {result.category} · {result.churchName}
                    </p>
                    <h2 className="mt-1.5 font-serif text-xl font-medium leading-snug text-foreground">{result.title}</h2>
                    {result.description && (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{result.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
