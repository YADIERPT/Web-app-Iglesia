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
          <form className="flex gap-2 rounded-xl border border-border bg-card p-2" role="search">
            <Search className="ml-3 mt-3 size-5 text-primary" aria-hidden />
            <input autoFocus name="q" defaultValue={q} className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base outline-none" placeholder="Escribe una palabra o frase" />
            <button className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Buscar</button>
          </form>
          <div className="mt-8">
            {!q ? <EmptyState>Escribe un término para iniciar la búsqueda.</EmptyState> : results.length === 0 ? <EmptyState>No encontramos resultados públicos para esta búsqueda.</EmptyState> : <div className="divide-y divide-border rounded-xl border border-border bg-card">{results.map((result) => <Link key={`${result.category}-${result.id}`} href={result.href} target={result.category === 'Archivo' ? '_blank' : undefined} rel={result.category === 'Archivo' ? 'noopener noreferrer' : undefined} className="block p-5 transition-colors hover:bg-secondary"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-text">{result.category} · {result.churchName}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{result.title}</h2><p className="mt-2 text-sm text-muted-foreground">{result.description}</p></Link>)}</div>}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
