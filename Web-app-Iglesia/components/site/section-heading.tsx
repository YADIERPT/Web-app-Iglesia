import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string
  title: React.ReactNode
  description?: string
  align?: 'left' | 'center'
}) {
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p
        className={cn(
          'mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:tracking-[0.35em]',
          align === 'center' && 'justify-center',
        )}
      >
        <span className="h-px w-8 bg-primary" />
        {eyebrow}
        {align === 'center' && <span className="h-px w-8 bg-primary" />}
      </p>
      <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">{title}</h2>
      {description && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>}
    </Reveal>
  )
}
