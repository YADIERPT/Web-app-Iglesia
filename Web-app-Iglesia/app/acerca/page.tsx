import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Church, ShieldCheck } from 'lucide-react'
import { PageIntro, PublicShell } from '@/components/site/public-shell'
import { getChurches } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Acerca de la red · Archivo Digital de Iglesias de Mérida',
  description: 'Conoce la iniciativa para conservar, digitalizar y compartir el patrimonio histórico, artístico y documental de las iglesias de Mérida, Yucatán.',
}

export default async function AcercaPage() {
  const churches = await getChurches()

  return (
    <PublicShell>
      <PageIntro
        title="Acerca de la red"
        description="Una plataforma viva para la conservación, catalogación y difusión del patrimonio religioso de Mérida, Yucatán."
      />

      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Misión y propósito */}
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              El <strong className="font-serif text-xl font-semibold text-foreground">Archivo Digital de Iglesias de Mérida</strong> nace
              con el propósito de proteger, organizar y poner al alcance de la comunidad la invaluable riqueza patrimonial, histórica y
              litúrgica custodiada por los templos centenarios de nuestra ciudad.
            </p>
            <p>
              A lo largo de los siglos, las parroquias y rectorías de Mérida han acumulado una herencia arquitectónica, documental y devocional
              singular: pinturas virreinales, orfebrería sacra, imágenes devocionales, partituras y actas que dan testimonio de la vida espiritual
              y social de Yucatán. Esta iniciativa integra tecnología moderna para garantizar que dicha memoria permanezca accesible y segura.
            </p>
          </div>

          {/* Pilares */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <BookOpen className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-serif text-xl font-semibold">Archivo histórico</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Preservación digital de libros, códices y documentos para consulta pública y salvaguarda de fuentes primarias.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShieldCheck className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-serif text-xl font-semibold">Patrimonio catalogado</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Registro sistemático de bienes muebles, imágenes y piezas sagradas bajo rigurosos criterios de conservación.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Church className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-serif text-xl font-semibold">Comunidad viva</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Información actualizada de horarios litúrgicos, celebraciones, festividades patronales y servicios de cada sede.
              </p>
            </div>
          </div>

          {/* Sedes de la red */}
          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-semibold">Iglesias que integran la red</h2>
            <p className="text-sm text-muted-foreground">
              La red está conformada actualmente por {churches.length} sedes históricas en Mérida. Puedes consultar el catálogo individual de cada una:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {churches.map((church) => (
                <Link
                  key={church.id}
                  href={`/iglesias/${church.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary"
                >
                  <div>
                    <h3 className="font-serif text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                      {church.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {church.address ?? 'Centro Histórico, Mérida'}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
